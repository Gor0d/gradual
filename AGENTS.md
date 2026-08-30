# AGENTS.md — instruções para o Codex

Contexto completo de produto e arquitetura em [`docs/architecture.md`](./docs/architecture.md). Regras de código/schema/PR compartilhadas com o Claude Code em [`docs/CONVENTIONS.md`](./docs/CONVENTIONS.md) — leia os dois antes de mexer em qualquer coisa aqui.

## Escopo do Codex (domínio B2B + fornecedor + pagamentos)

- `apps/web/app/(b2b)/**` — dashboard de organizadora, CRM, turmas, configurações, portal do cliente co-branded.
- `apps/web/app/(vendor)/**` — painel do fornecedor (perfil, portfólio, tabela de preços, leads recebidos).
- `apps/web/components/b2b/**`
- `apps/web/lib/payments/**` — integração com o(s) gateway(s) de pagamento (Fase 2 em diante). Decisão de provedor ainda em aberto (Woovi único vs Pagar.me+AbacatePay, ver `docs/architecture.md`) — escrever atrás de uma interface própria para não travar nisso.
- CRM, propostas, contratos digitais, split/repasse de comissão.

## Fora do escopo do Codex (propriedade do Claude Code)

- `apps/web/app/(b2c)/**`, `apps/web/app/(marketplace)/**` (consumo/busca do lado do formando)
- `apps/web/lib/ai/**`
- `apps/web/components/checklist/**`, `apps/web/components/marketplace/**`
- Definição inicial de `packages/db-schema` (schema novo é proposto pelo Claude Code; Codex revisa e adiciona o que o domínio B2B precisar via PR próprio)

## Regras compartilhadas (resumo — detalhes em `docs/CONVENTIONS.md`)

- 1 migration por PR em `packages/db-schema`, nunca editar migration já mergeada.
- Toda tabela nova com `organization_id`/`user_id` precisa de RLS no mesmo PR.
- TypeScript estrito, sem `any`. Mutações via Server Actions.
- `packages/shared-types` e `packages/db-schema` são zona compartilhada — mudança de schema é acordada antes, não descoberta em conflito de merge.
- `components/ui` (shadcn): consumir livremente, não alterar componente-base sem alinhar com quem mais usa.
- Título de PR com prefixo de domínio: `[b2b]`, `[vendor]`, `[payments]`.
- PR em `lib/payments/**` ou qualquer fluxo multi-tenant precisa descrever como o isolamento entre organizações foi testado.

## Se precisar mexer fora do escopo

Abra um PR pequeno e específico propondo a mudança, não edite direto os arquivos do domínio do Claude Code.
