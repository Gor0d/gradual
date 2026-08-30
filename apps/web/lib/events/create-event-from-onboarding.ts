"use server";

import { ensureCurrentUser } from "@/lib/auth/ensure-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type OnboardingInput = {
  course: string;
  institution: string;
  eventDate: string;
  city: string;
  state?: string;
  estimatedBudget?: number;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type EventTypeRow = { id: string };
type EventRow = { id: string; event_date: string | null };
type ChecklistTemplateRow = { id: string };
type ChecklistTemplateItemRow = {
  id: string;
  title: string;
  description: string | null;
  offset_days_before_event: number;
  vendor_category_id: string | null;
};

/**
 * Creates the formando's event and seeds tasks from the active checklist
 * template for "colacao_de_grau" (see packages/db-schema/seed.ts). Runs
 * entirely through the Supabase client, never Drizzle — this is a
 * user-scoped mutation, so events_insert_own/tasks_all_own_event RLS is
 * what actually enforces it can only ever create the caller's own data
 * (see docs/CONVENTIONS.md, "Acesso a dados").
 */
export async function createEventFromOnboarding(
  input: OnboardingInput,
): Promise<{ eventId: string }> {
  const user = await ensureCurrentUser();
  const supabase = await createSupabaseServerClient();

  const { data: eventType, error: eventTypeError } = await supabase
    .from("event_types")
    .select("id")
    .eq("slug", "colacao_de_grau")
    .single<EventTypeRow>();

  if (eventTypeError || !eventType) {
    throw new Error("Tipo de evento 'colação de grau' não está configurado.");
  }

  // Noon UTC avoids the date shifting a day depending on the reader's timezone.
  const eventDateIso = new Date(`${input.eventDate}T12:00:00Z`).toISOString();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({
      user_id: user.id,
      event_type_id: eventType.id,
      title: `Colação de Grau — ${input.course}`,
      event_date: eventDateIso,
      city: input.city,
      state: input.state ?? null,
      estimated_budget: input.estimatedBudget ?? null,
    })
    .select("id, event_date")
    .single<EventRow>();

  if (eventError || !event) {
    throw eventError ?? new Error("Não foi possível criar o evento.");
  }

  await seedTasksFromTemplate(supabase, eventType.id, event);

  return { eventId: event.id };
}

async function seedTasksFromTemplate(
  supabase: SupabaseServerClient,
  eventTypeId: string,
  event: EventRow,
) {
  if (!event.event_date) return;

  const { data: template } = await supabase
    .from("checklist_templates")
    .select("id")
    .eq("event_type_id", eventTypeId)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle<ChecklistTemplateRow>();

  if (!template) return;

  const { data: items, error: itemsError } = await supabase
    .from("checklist_template_items")
    .select("id, title, description, offset_days_before_event, vendor_category_id")
    .eq("template_id", template.id)
    .returns<ChecklistTemplateItemRow[]>();

  if (itemsError || !items || items.length === 0) return;

  const eventDate = new Date(event.event_date);
  const tasks = items.map((item) => {
    const dueDate = new Date(eventDate);
    dueDate.setUTCDate(dueDate.getUTCDate() - item.offset_days_before_event);

    return {
      event_id: event.id,
      template_item_id: item.id,
      vendor_category_id: item.vendor_category_id,
      title: item.title,
      description: item.description,
      due_date: dueDate.toISOString(),
      origin: "template" as const,
    };
  });

  const { error: tasksError } = await supabase.from("tasks").insert(tasks);
  if (tasksError) {
    throw tasksError;
  }
}
