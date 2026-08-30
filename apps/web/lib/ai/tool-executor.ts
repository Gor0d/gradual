import type { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type ToolExecutor = (name: string, input: unknown) => Promise<unknown>;

type EventRow = { title: string; event_date: string | null; city: string | null; state: string | null };
type TaskRow = { id: string; title: string; description: string | null; due_date: string | null; status: string };

function asRecord(input: unknown): Record<string, unknown> {
  if (typeof input !== "object" || input === null) {
    throw new Error("Entrada inválida para a ferramenta.");
  }
  return input as Record<string, unknown>;
}

function requireString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Campo obrigatório ausente ou inválido: ${key}`);
  }
  return value;
}

function optionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function toDueDateIso(dateOnly: string): string {
  // Noon UTC avoids the date shifting a day depending on the reader's timezone.
  return new Date(`${dateOnly}T12:00:00Z`).toISOString();
}

/**
 * Every tool here runs through the Supabase client bound to the current
 * request's session — never Drizzle. This is a user-scoped operation (the
 * assistant acts on the caller's own event), so tasks_all_own_event RLS is
 * what actually enforces the assistant can only ever touch this event's
 * data (docs/CONVENTIONS.md, "Acesso a dados").
 */
export function createToolExecutor(supabase: SupabaseServerClient, eventId: string): ToolExecutor {
  return async (name, input) => {
    switch (name) {
      case "get_event_status":
        return getEventStatus(supabase, eventId);
      case "create_task":
        return createTask(supabase, eventId, asRecord(input));
      case "reschedule_task":
        return rescheduleTask(supabase, eventId, asRecord(input));
      case "cancel_task":
        return cancelTask(supabase, eventId, asRecord(input));
      default:
        throw new Error(`Ferramenta desconhecida: ${name}`);
    }
  };
}

async function getEventStatus(supabase: SupabaseServerClient, eventId: string) {
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("title, event_date, city, state")
    .eq("id", eventId)
    .single<EventRow>();
  if (eventError || !event) {
    throw eventError ?? new Error("Evento não encontrado.");
  }

  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, title, description, due_date, status")
    .eq("event_id", eventId)
    .order("due_date", { ascending: true })
    .returns<TaskRow[]>();
  if (tasksError) {
    throw tasksError;
  }

  return { event, tasks: tasks ?? [] };
}

async function createTask(supabase: SupabaseServerClient, eventId: string, input: Record<string, unknown>) {
  const title = requireString(input, "title");
  const dueDate = requireString(input, "due_date");
  const description = optionalString(input, "description");

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      event_id: eventId,
      title,
      description: description ?? null,
      due_date: toDueDateIso(dueDate),
      origin: "ai",
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    throw error ?? new Error("Não foi possível criar a tarefa.");
  }
  return { task_id: data.id };
}

async function rescheduleTask(supabase: SupabaseServerClient, eventId: string, input: Record<string, unknown>) {
  const taskId = requireString(input, "task_id");
  const dueDate = requireString(input, "due_date");

  const { error } = await supabase
    .from("tasks")
    .update({ due_date: toDueDateIso(dueDate) })
    .eq("id", taskId)
    .eq("event_id", eventId);

  if (error) {
    throw error;
  }
  return { ok: true };
}

async function cancelTask(supabase: SupabaseServerClient, eventId: string, input: Record<string, unknown>) {
  const taskId = requireString(input, "task_id");

  const { error } = await supabase
    .from("tasks")
    .update({ status: "cancelada" })
    .eq("id", taskId)
    .eq("event_id", eventId);

  if (error) {
    throw error;
  }
  return { ok: true };
}
