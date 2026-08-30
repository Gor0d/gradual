# Convenções Compartilhadas — Gradual

> Fonte única de verdade das regras que valem tanto para Claude Code quanto para Codex. `CLAUDE.md` e `AGENTS.md` apontam para este arquivo em vez de duplicar as regras — se algo mudar, muda só aqui.

Contexto de produto e arquitetura completos em [`docs/architecture.md`](./architecture.md).

## Código

- TypeScript estrito, sem `any`. Preferir tipos gerados a partir do schema (`packages/shared-types`) a redefinições manuais.
- Nomes de arquivo em kebab-case.
- Mutações de dados via Server Actions; Route Handlers (`app/api/**`) só para exposição externa (webhooks de pagamento, integrações de terceiros).
- Toda tabela nova com `organization_id` ou `user_id` precisa de RLS policy no mesmo PR que a cria — nunca depender só de filtro na aplicação para isolamento multi-tenant.
- Modo escuro/claro via tokens de cor semânticos (`prefers-color-scheme` + `color-scheme`), nunca cor literal espalhada pelos componentes.

## Banco de dados (Drizzle)

- **1 migration por PR**, sequencial. Nunca editar uma migration que já foi mergeada — criar uma nova.
- Migration deve ser revisada por quem não a escreveu antes do merge (ou seja: se Claude Code escreveu, Codex revisa, e vice-versa, quando possível).
- `packages/db-schema` é zona compartilhada: mudança de schema é acordada antes de implementar, não descoberta via conflito de merge.
- Nada de "colação de grau" hardcoded em enum/schema — tipos de evento e categorias de fornecedor são dados (`event_types`, `vendor_categories`), não estrutura de tabela. Ver princípio em `docs/architecture.md`.

## Divisão de trabalho por domínio

Ver escopo detalhado em `CLAUDE.md` e `AGENTS.md`. Regra geral: dividir por domínio vertical (B2C+IA vs B2B+fornecedor+pagamentos), não por camada — cada ferramenta deve poder entregar uma feature de ponta a ponta (rota, componente, server action) sem esperar a outra.

- `components/ui` (shadcn) é biblioteca congelada: qualquer ferramenta consome livremente; mudança estrutural num componente-base exige alinhar antes com quem mais o usa.
- Fora do próprio escopo: abrir um PR pequeno e específico propondo a mudança, não editar direto os arquivos do outro domínio.

## PRs

- Prefixo de domínio no título: `[b2c]`, `[marketplace]`, `[ai]`, `[b2b]`, `[vendor]`, `[payments]`.
- PR que mexe em `lib/payments/**` ou em qualquer fluxo multi-tenant precisa descrever explicitamente como o isolamento entre organizações foi testado.

## Pendências que afetam convenções futuras

- Framework de testes e CI ainda não definido (ver `docs/architecture.md`, Riscos e Decisões em Aberto, item 8) — assim que decidido, este arquivo ganha uma seção de testes obrigatórios por domínio.
- Gateway de pagamento (Woovi único vs Pagar.me+AbacatePay) ainda em aberto — `lib/payments/**` deve ser escrito de forma a isolar o provedor atrás de uma interface, para não travar a decisão.
