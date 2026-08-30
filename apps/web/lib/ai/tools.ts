import type Anthropic from "@anthropic-ai/sdk";

/**
 * Marketplace search (mentioned in docs/architecture.md's tool list) isn't
 * here yet — there's no marketplace query capability built to back it.
 * Add it once that domain exists instead of shipping a tool that can't do
 * anything.
 */
export const ASSISTANT_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_event_status",
    description:
      "Retorna os dados do evento (título, data, cidade) e a lista completa de tarefas do checklist, com id, status e prazo de cada uma. Use antes de criar, reagendar ou cancelar qualquer tarefa — nunca suponha o que já existe no checklist.",
    input_schema: { type: "object", properties: {}, additionalProperties: false, required: [] },
    strict: true,
  },
  {
    name: "create_task",
    description: "Cria uma nova tarefa no checklist do evento.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Título curto da tarefa." },
        description: { type: "string", description: "Detalhe opcional da tarefa." },
        due_date: { type: "string", description: "Data limite no formato AAAA-MM-DD." },
      },
      required: ["title", "due_date"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "reschedule_task",
    description: "Muda a data limite de uma tarefa existente do checklist.",
    input_schema: {
      type: "object",
      properties: {
        task_id: { type: "string", description: "id da tarefa, obtido via get_event_status." },
        due_date: { type: "string", description: "Nova data limite no formato AAAA-MM-DD." },
      },
      required: ["task_id", "due_date"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "cancel_task",
    description:
      "Cancela uma tarefa que não se aplica ao formando (ex.: ele não vai comprar anel de formatura). Não apaga o histórico — só marca a tarefa como cancelada.",
    input_schema: {
      type: "object",
      properties: {
        task_id: { type: "string", description: "id da tarefa, obtido via get_event_status." },
      },
      required: ["task_id"],
      additionalProperties: false,
    },
    strict: true,
  },
];
