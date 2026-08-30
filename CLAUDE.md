# CLAUDE.md — instruções para o Claude Code

Contexto completo de produto e arquitetura em [`docs/architecture.md`](./docs/architecture.md). Regras de código/schema/PR compartilhadas com o Codex em [`docs/CONVENTIONS.md`](./docs/CONVENTIONS.md) — leia os dois antes de mexer em qualquer coisa aqui.

## Escopo do Claude Code (domínio B2C + IA + marketplace/consumo)

- `apps/web/app/(b2c)/**` — dashboard do formando, checklist, evento, assistente de IA.
- `apps/web/app/(marketplace)/**` — busca, listagem, comparação de fornecedores (lado de consumo/formando).
- `apps/web/lib/ai/**` — tools do assistente (`get_event_status`, `create_task`, `reschedule_task`, busca no marketplace), prompt de sistema, guardrails.
- `apps/web/components/checklist/**`, `apps/web/components/marketplace/**`
- Definição inicial de `packages/db-schema` (proposta pelo Claude Code; Codex revisa e estende para o domínio B2B via PR próprio).
- Manutenção de `AGENTS.md`, `CLAUDE.md` e `docs/CONVENTIONS.md`.

## Fora do escopo do Claude Code (propriedade do Codex)

- `apps/web/app/(b2b)/**`, `apps/web/app/(vendor)/**`
- `apps/web/components/b2b/**`
- `apps/web/lib/payments/**`
- CRM, propostas, contratos digitais

## Regras compartilhadas (resumo — detalhes em `docs/CONVENTIONS.md`)

- 1 migration por PR em `packages/db-schema`, nunca editar migration já mergeada.
- Toda tabela nova com `organization_id`/`user_id` precisa de RLS no mesmo PR.
- TypeScript estrito, sem `any`. Mutações via Server Actions.
- Nada de "colação de grau" hardcoded em enum/schema — tipos de evento (`event_types`) e categorias de fornecedor (`vendor_categories`) são dados, não estrutura de tabela, para suportar a expansão futura (casamento, aniversário etc.) sem redesenho.
- `packages/shared-types` e `packages/db-schema` são zona compartilhada — mudança de schema é acordada antes, não descoberta em conflito de merge.
- `components/ui` (shadcn): consumir livremente, não alterar componente-base sem alinhar com quem mais usa.
- Título de PR com prefixo de domínio: `[b2c]`, `[marketplace]`, `[ai]`.
- IA nunca escreve direto no banco — sempre via Server Actions que validam permissão/tenant.

## Se precisar mexer fora do escopo

Abra um PR pequeno e específico propondo a mudança, não edite direto os arquivos do domínio do Codex.
