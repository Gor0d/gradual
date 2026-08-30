import { redirect } from "next/navigation";

import { AssistantChat } from "@/components/checklist/assistant-chat";
import { getOrCreateConversation, getMessagesForDisplay } from "@/lib/ai/conversation";
import { requireCurrentUser } from "@/lib/auth/require-user";
import { getPrimaryEventId } from "@/lib/events/get-primary-event";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AssistantPage() {
  await requireCurrentUser();

  const eventId = await getPrimaryEventId();
  if (!eventId) {
    redirect("/onboarding");
  }

  const supabase = await createSupabaseServerClient();
  const conversationId = await getOrCreateConversation(supabase, eventId);
  const messages = await getMessagesForDisplay(supabase, conversationId);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-12 text-foreground">
      <h1 className="text-2xl font-semibold tracking-tight">Assistente</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pergunte sobre seu checklist, peça pra criar, reagendar ou cancelar tarefas.
      </p>
      <div className="mt-6 flex-1">
        <AssistantChat eventId={eventId} initialMessages={messages} />
      </div>
    </main>
  );
}
