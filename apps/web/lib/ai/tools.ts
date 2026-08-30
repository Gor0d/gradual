import type { ToolDefinition } from "@/lib/ai/provider";

/**
 * Provider-neutral tool definitions. Each adapter (lib/ai/providers/*)
 * converts these into its own SDK's wire format at call time — the tools
 * themselves and their behavior (lib/ai/tool-executor.ts) never change per
 * provider.
 *
 * Marketplace search (mentioned in docs/architecture.md's tool list) isn't
 * here yet — there's no marketplace query capability built to back it.
 * Add it once that domain exists instead of shipping a tool that can't do
 * anything.
 */
export const ASSISTANT_TOOLS: ToolDefinition[] = [
  {
    name: "get_event_status",
    description:
      "Retorna os dados do evento (título, data, cidade, orçamento) e a lista completa de tarefas do checklist, com id, status e prazo de cada uma. Use antes de criar, reagendar, concluir ou cancelar qualquer tarefa, ou de atualizar o orçamento — nunca suponha o que já existe no checklist.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false, required: [] },
  },
  {
    name: "create_task",
    description:
      "Cria uma nova tarefa no checklist do evento. Só use quando o pedido não corresponder a nenhuma tarefa existente nem a um dado do evento (ex.: orçamento) — nesses casos use update_event_budget, complete_task ou reschedule_task. Se já existir uma tarefa ativa com o mesmo título, a ferramenta retorna { duplicate: true } em vez de criar outra. Se o prazo já passou, retorna { requires_confirmation: true } a menos que confirm seja true.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Título curto da tarefa." },
        description: { type: "string", description: "Detalhe opcional da tarefa." },
        due_date: { type: "string", description: "Data limite no formato AAAA-MM-DD." },
        confirm: {
          type: "boolean",
          description: "Envie true apenas depois que o usuário confirmar explicitamente um prazo já no passado.",
        },
      },
      required: ["title", "due_date"],
      additionalProperties: false,
    },
  },
  {
    name: "reschedule_task",
    description:
      "Muda a data limite de uma tarefa existente do checklist. Se o novo prazo já passou, retorna { requires_confirmation: true } a menos que confirm seja true.",
    inputSchema: {
      type: "object",
      properties: {
        task_id: { type: "string", description: "id da tarefa, obtido via get_event_status." },
        due_date: { type: "string", description: "Nova data limite no formato AAAA-MM-DD." },
        confirm: {
          type: "boolean",
          description: "Envie true apenas depois que o usuário confirmar explicitamente um prazo já no passado.",
        },
      },
      required: ["task_id", "due_date"],
      additionalProperties: false,
    },
  },
  {
    name: "cancel_task",
    description:
      "Cancela uma tarefa que não se aplica ao formando (ex.: ele não vai comprar anel de formatura). Não apaga o histórico — só marca a tarefa como cancelada.",
    inputSchema: {
      type: "object",
      properties: {
        task_id: { type: "string", description: "id da tarefa, obtido via get_event_status." },
      },
      required: ["task_id"],
      additionalProperties: false,
    },
  },
  {
    name: "complete_task",
    description: "Marca uma tarefa do checklist como concluída, porque o formando já resolveu o que ela pedia.",
    inputSchema: {
      type: "object",
      properties: {
        task_id: { type: "string", description: "id da tarefa, obtido via get_event_status." },
      },
      required: ["task_id"],
      additionalProperties: false,
    },
  },
  {
    name: "update_event_budget",
    description:
      "Atualiza o orçamento estimado do evento. Use sempre que o formando informar um valor de orçamento — nunca crie uma tarefa nova para isso.",
    inputSchema: {
      type: "object",
      properties: {
        amount: { type: "number", description: "Valor do orçamento em reais (ex.: 10000 para R$ 10.000,00)." },
      },
      required: ["amount"],
      additionalProperties: false,
    },
  },
];
