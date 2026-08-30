"use server";

import type Anthropic from "@anthropic-ai/sdk";

import { aiMessages } from "@gradual/db-schema";

import { ensureCurrentUser } from "@/lib/auth/ensure-user";
import {
  getMessagesForDisplay,
  getOrCreateConversation,
  insertUserMessage,
  type ChatMessage,
} from "@/lib/ai/conversation";
import { generateAssistantReply } from "@/lib/ai/generate-reply";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { createToolExecutor } from "@/lib/ai/tool-executor";
import { db } from "@/lib/db/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type { ChatMessage } from "@/lib/ai/conversation";

type EventRow = { id: string; title: string; event_date: string | null };

export async function sendAssistantMessage(eventId: string, userMessage: string): Promise<ChatMessage[]> {
  await ensureCurrentUser();
  const supabase = await createSupabaseServerClient();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, title, event_date")
    .eq("id", eventId)
    .single<EventRow>();
  if (eventError || !event) {
    throw eventError ?? new Error("Evento não encontrado.");
  }

  const conversationId = await getOrCreateConversation(supabase, eventId);
  await insertUserMessage(supabase, conversationId, userMessage);

  const priorMessages = await getMessagesForDisplay(supabase, conversationId);
  const history: Anthropic.MessageParam[] = priorMessages
    .filter((message): message is ChatMessage & { role: "user" | "assistant" } =>
      message.role === "user" || message.role === "assistant",
    )
    .map((message) => ({ role: message.role, content: message.content }));

  const executeTool = createToolExecutor(supabase, eventId);
  const systemPrompt = buildSystemPrompt(event);
  const reply = await generateAssistantReply(systemPrompt, history, executeTool);

  // role = 'assistant' and tool_calls are only writable through the
  // service-role Drizzle client — ai_messages RLS has no insert policy for
  // that combination on the authenticated role (see packages/db-schema/schema.ts).
  await db.insert(aiMessages).values({
    conversationId,
    role: "assistant",
    content: reply.text,
    toolCalls: reply.toolCalls.length > 0 ? reply.toolCalls : null,
  });

  return getMessagesForDisplay(supabase, conversationId);
}
