import type { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type ToolExecutor = (name: string, input: unknown) => Promise<unknown>;

type EventRow = { title: string; event_date: string | null; city: string | null; state: string | null };
type TaskRow = { id: string; title: string; description: string | null; due_date: string | null; status: string };

const brlFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

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

function requireNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`Campo obrigatório ausente ou inválido: ${key}`);
  }
  return value;
}

function optionalBoolean(record: Record<string, unknown>, key: string): boolean {
  return record[key] === true;
}

function toDueDateIso(dateOnly: string): string {
  // Noon UTC avoids the date shifting a day depending on the reader's timezone.
  return new Date(`${dateOnly}T12:00:00Z`).toISOString();
}

function isPastDate(dateOnly: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return dateOnly < today;
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
      case "complete_task":
        return completeTask(supabase, eventId, asRecord(input));
      case "update_event_budget":
        return updateEventBudget(supabase, eventId, asRecord(input));
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

async function findActiveTaskByTitle(supabase: SupabaseServerClient, eventId: string, title: string) {
  const normalized = title.trim().toLowerCase();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, status")
    .eq("event_id", eventId)
    .neq("status", "cancelada")
    .returns<{ id: string; title: string; status: string }[]>();
  if (error) {
    throw error;
  }
  return (data ?? []).find((task) => task.title.trim().toLowerCase() === normalized) ?? null;
}

async function createTask(supabase: SupabaseServerClient, eventId: string, input: Record<string, unknown>) {
  const title = requireString(input, "title");
  const dueDate = requireString(input, "due_date");
  const description = optionalString(input, "description");
  const confirm = optionalBoolean(input, "confirm");

  // Two guards before ever inserting: a checklist item with this title
  // already active (case-insensitive), or a due date already in the past —
  // both are far more often a sign the model picked the wrong tool (it
  // should update/complete something existing) than a real new task.
  const existing = await findActiveTaskByTitle(supabase, eventId, title);
  if (existing) {
    return { duplicate: true, existing_task_id: existing.id, existing_title: existing.title };
  }

  if (isPastDate(dueDate) && !confirm) {
    return { requires_confirmation: true, reason: "due_date_no_passado", due_date: dueDate };
  }

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
  const confirm = optionalBoolean(input, "confirm");

  if (isPastDate(dueDate) && !confirm) {
    return { requires_confirmation: true, reason: "due_date_no_passado", due_date: dueDate };
  }

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

async function completeTask(supabase: SupabaseServerClient, eventId: string, input: Record<string, unknown>) {
  const taskId = requireString(input, "task_id");

  const { error } = await supabase
    .from("tasks")
    .update({ status: "concluida" })
    .eq("id", taskId)
    .eq("event_id", eventId);

  if (error) {
    throw error;
  }
  return { ok: true };
}

async function updateEventBudget(supabase: SupabaseServerClient, eventId: string, input: Record<string, unknown>) {
  const amount = requireNumber(input, "amount");

  const { error } = await supabase.from("events").update({ estimated_budget: amount }).eq("id", eventId);

  if (error) {
    throw error;
  }
  // formatted is pre-computed so the model quotes a correct pt-BR currency
  // string instead of composing its own — see system-prompt.ts.
  return { ok: true, formatted: brlFormatter.format(amount) };
}
