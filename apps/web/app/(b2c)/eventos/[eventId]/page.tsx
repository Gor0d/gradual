import { notFound } from "next/navigation";

import { AddToCalendar } from "@/components/checklist/add-to-calendar";
import { TaskRow } from "@/components/checklist/task-row";
import { requireCurrentUser } from "@/lib/auth/require-user";
import { cn } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type EventRow = {
  id: string;
  title: string;
  event_date: string | null;
  city: string | null;
  state: string | null;
};

type TaskRecord = {
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

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

function daysUntil(dateIso: string): number {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const target = new Date(dateIso);
  target.setUTCHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function isOverdue(dueDateIso: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return dueDateIso.slice(0, 10) < today;
}

function countdownLabel(daysLeft: number): string {
  if (daysLeft > 0) return `faltam ${daysLeft} dias`;
  if (daysLeft === 0) return "é hoje!";
  return "já aconteceu";
}

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

  const { data: tasksData } = await supabase
    .from("tasks")
    .select("id, title, description, due_date, status")
    .eq("event_id", eventId)
    .order("due_date", { ascending: true })
    .returns<TaskRecord[]>();

  const tasks = tasksData ?? [];
  const active = tasks.filter((task) => task.status !== "cancelada");
  const completed = active.filter((task) => task.status === "concluida");
  const cancelled = tasks.filter((task) => task.status === "cancelada");
  const overdue = active.filter(
    (task) => task.status !== "concluida" && task.due_date && isOverdue(task.due_date),
  );
  const upcoming = active.filter(
    (task) => task.status !== "concluida" && !(task.due_date && isOverdue(task.due_date)),
  );

  const progressTotal = active.length;
  const progressDone = completed.length;
  const progressPct = progressTotal > 0 ? Math.round((progressDone / progressTotal) * 100) : 0;
  const daysLeft = event.event_date ? daysUntil(event.event_date) : null;

  function dueDateLabel(task: TaskRecord): string | null {
    return task.due_date ? shortDateFormatter.format(new Date(task.due_date)) : null;
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl italic tracking-tight">{event.title}</h1>
            <p className="mt-1 text-muted-foreground">
              {event.event_date ? dateFormatter.format(new Date(event.event_date)) : "Data a definir"}
              {event.city ? ` — ${event.city}${event.state ? `/${event.state}` : ""}` : ""}
              {daysLeft !== null ? ` · ${countdownLabel(daysLeft)}` : ""}
            </p>
          </div>
          {event.event_date ? (
            <AddToCalendar
              id={event.id}
              event={{
                title: event.title,
                date: event.event_date,
                location: event.city ? `${event.city}${event.state ? `/${event.state}` : ""}` : null,
              }}
            />
          ) : null}
        </div>

        {progressTotal > 0 ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progresso do checklist</span>
              <span>
                {progressDone}/{progressTotal} concluídas
              </span>
            </div>
            <div
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progresso do checklist"
            >
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        ) : null}
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma tarefa no checklist ainda.</p>
      ) : (
        <>
          <TaskGroup title="Atrasadas" tasks={overdue} dueDateLabel={dueDateLabel} emphasize />
          <TaskGroup title="Próximas" tasks={upcoming} dueDateLabel={dueDateLabel} />
          <TaskGroup title="Concluídas" tasks={completed} dueDateLabel={dueDateLabel} />
          {cancelled.length > 0 ? (
            <details>
              <summary className="cursor-pointer text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                Canceladas ({cancelled.length})
              </summary>
              <div className="mt-3 divide-y rounded-2xl border bg-card">
                {cancelled.map((task) => (
                  <TaskRow key={task.id} task={task} dueDateLabel={dueDateLabel(task)} />
                ))}
              </div>
            </details>
          ) : null}
        </>
      )}
    </div>
  );
}

function TaskGroup({
  title,
  tasks,
  dueDateLabel,
  emphasize,
}: {
  title: string;
  tasks: TaskRecord[];
  dueDateLabel: (task: TaskRecord) => string | null;
  emphasize?: boolean;
}) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <section>
      <p
        className={cn(
          "text-xs font-extrabold uppercase tracking-wide",
          emphasize ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {title} <span className="font-normal normal-case text-muted-foreground">({tasks.length})</span>
      </p>
      <div className="mt-3 divide-y rounded-2xl border bg-card">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} dueDateLabel={dueDateLabel(task)} />
        ))}
      </div>
    </section>
  );
}
