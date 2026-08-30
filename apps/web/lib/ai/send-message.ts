"use server";

import type Anthropic from "@anthropic-ai/sdk";
import { aiConversations, aiMessages, events } from "@gradual/db-schema";
import { and, eq } from "drizzle-orm";

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
  const user = await ensureCurrentUser();
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

  // Drizzle bypasses RLS entirely (it connects as the table owner), so this
  // is the trust boundary: re-derive ownership straight from the DB right
  // before the privileged write, instead of relying on the RLS-gated reads
  // earlier in this function to have already guaranteed it. Don't remove
  // this just because conversationId "can only" have come from an owned
  // event above — that chain is exactly what a later refactor could break
  // silently.
  const [ownedConversation] = await db
    .select({ id: aiConversations.id })
    .from(aiConversations)
    .innerJoin(events, eq(events.id, aiConversations.eventId))
    .where(and(eq(aiConversations.id, conversationId), eq(events.userId, user.id)));

  if (!ownedConversation) {
    throw new Error("Conversa não pertence ao usuário autenticado.");
  }

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
