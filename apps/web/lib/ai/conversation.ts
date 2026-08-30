import type { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type ConversationRow = { id: string };

export type MessageRow = {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  created_at: string;
};

export type ChatMessage = { id: string; role: MessageRow["role"]; content: string };

export async function getOrCreateConversation(
  supabase: SupabaseServerClient,
  eventId: string,
): Promise<string> {
  const { data: existing } = await supabase
    .from("ai_conversations")
    .select("id")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<ConversationRow>();

  if (existing) {
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from("ai_conversations")
    .insert({ event_id: eventId })
    .select("id")
    .single<ConversationRow>();

  if (error || !created) {
    throw error ?? new Error("Não foi possível iniciar a conversa com o assistente.");
  }
  return created.id;
}

export async function insertUserMessage(
  supabase: SupabaseServerClient,
  conversationId: string,
  content: string,
): Promise<void> {
  const { error } = await supabase
    .from("ai_messages")
    .insert({ conversation_id: conversationId, role: "user", content });
  if (error) {
    throw error;
  }
}

export async function getMessagesForDisplay(
  supabase: SupabaseServerClient,
  conversationId: string,
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("ai_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .returns<MessageRow[]>();

  if (error) {
    throw error;
  }
  return (data ?? []).map(({ id, role, content }) => ({ id, role, content }));
}
