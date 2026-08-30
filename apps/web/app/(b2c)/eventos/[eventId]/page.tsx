import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth/require-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type EventRow = {
  id: string;
  title: string;
  event_date: string | null;
  city: string | null;
  state: string | null;
};

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

type EventPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function EventPage({ params }: EventPageProps) {
  const { eventId } = await params;
  await requireCurrentUser();

  const supabase = await createSupabaseServerClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title, event_date, city, state")
    .eq("id", eventId)
    .maybeSingle<EventRow>();

  if (!event) {
    notFound();
  }

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, description, due_date, status")
    .eq("event_id", eventId)
    .order("due_date", { ascending: true })
    .returns<TaskRow[]>();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 text-foreground">
      <h1 className="text-3xl font-semibold tracking-tight">{event.title}</h1>
      <p className="mt-1 text-muted-foreground">
        {event.event_date ? dateFormatter.format(new Date(event.event_date)) : "Data a definir"}
        {event.city ? ` — ${event.city}${event.state ? `/${event.state}` : ""}` : ""}
      </p>

      <div className="mt-8 space-y-3">
        {(tasks ?? []).map((task) => (
          <Card key={task.id}>
            <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
              <CardTitle className="text-base font-medium">{task.title}</CardTitle>
              <span className="shrink-0 text-xs text-muted-foreground">
                {task.due_date ? dateFormatter.format(new Date(task.due_date)) : "Sem prazo"}
              </span>
            </CardHeader>
            {task.description ? (
              <CardContent className="pt-0 text-sm text-muted-foreground">{task.description}</CardContent>
            ) : null}
          </Card>
        ))}
      </div>
    </main>
  );
}
