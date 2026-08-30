# Gradual — PRD & Arquitetura Técnica (v0.1)

> Documento vivo. Qualquer mudança relevante de escopo, modelo de dados ou divisão de trabalho entre Claude Code e Codex deve ser refletida aqui primeiro.

## Contexto

Formandos de graduação no Brasil não têm apoio estruturado para organizar a colação de grau (aluguel de beca, anel de formatura, fotógrafo, buffet, local do evento). Hoje isso é feito manualmente, sem checklist, sem comparação de fornecedores, sem acompanhamento centralizado.

Pesquisa de mercado confirmou o gap: existem concorrentes brasileiros próximos (**Na Beca** — app de gestão de formatura com marketplace, +5 mil usuários, é o benchmark mais direto a superar; **Sua Formatura**, **Keeper**, **AppdaTurma** — focados em fintech/arrecadação de turma, sem checklist de IA nem marketplace comparativo; assessorias tradicionais como **Momento Formaturas**/**Memorizze** — atendimento humano, sem produto digital escalável). Nenhum combina (1) checklist guiado por IA, (2) marketplace multi-categoria comparável por localização/preço, (3) acompanhamento em tempo real e (4) um plano B2B robusto para organizadoras — esse é o espaço que o produto ocupa.

O negócio nasce no nicho de colação de grau (evento único-na-vida, ticket alto, decisão urgente e cheia de prazos) mas a visão de médio prazo é generalizar o mesmo modelo (checklist + marketplace + agenda) para casamentos, aniversários e festas em geral. Por isso a arquitetura de dados precisa suportar múltiplos tipos de evento desde o primeiro schema, mesmo que o MVP só implemente colação de grau.

O produto terá dois usuários pagantes: o formando (B2C, evento único) e organizadoras/cerimonialistas profissionais (B2B, recorrente — a receita recorrente do B2B é o contrapeso à natureza "compra única na vida" do B2C).

O desenvolvimento é feito em paralelo por **Claude Code** e **Codex** (OpenAI) no mesmo repositório — ver seção "Divisão de Trabalho" e os arquivos `CLAUDE.md`/`AGENTS.md` na raiz.

**Nome do produto**: **Gradual** (remete a "grau" e a uma jornada guiada passo a passo pela IA). Provisório até checagem formal de marca/domínio (INPI).

**Stack**: Next.js (App Router) + TypeScript + Postgres (Supabase), Tailwind + shadcn/ui, ORM Drizzle.

## Personas e Jornadas

**Formando (B2C)** — não sabe por onde começar, prazos de beca/anel/buffet se sobrepõem, não sabe se está pagando caro. Jornada: cadastro → onboarding conversacional com IA (curso, instituição, data da colação, cidade, orçamento, se vai em grupo) → IA gera checklist personalizado com prazos retroagidos a partir da data do evento → navega no marketplace filtrando por categoria/localização, compara preço/nota/portfólio → acompanha tudo num dashboard, pergunta à IA "o que eu faço agora" → avalia fornecedores pós-evento.

**Organizadora/Cerimonialista (B2B)** — gerencia múltiplas turmas em planilhas/WhatsApp, sem CRM/propostas/contratos/portal do cliente. Jornada: assina plano B2B → cria organização (tenant) com marca própria → cadastra turmas/eventos, convida formandos → usa CRM para leads, propostas, contratos → formandos daquela turma veem um checklist/dashboard co-branded dentro do Gradual. Organizadoras também podem ter perfil de vendor público no marketplace, não só ferramenta interna de gestão — gera receita adicional de comissão.

**Fornecedor/Parceiro** (loja de beca, fotógrafo autônomo etc.) — capta clientes de forma pulverizada hoje. Jornada: cadastra-se, escolhe categoria(s) e área geográfica, portfólio, preço fixo ou "sob consulta" → recebe leads/solicitações → fecha booking → recebe avaliações; ranking por engajamento/qualidade (modelo Zola), não só por quem paga mais.

## Escopo por Fase

**MVP (Fase 1) — só B2C.** Onboarding com IA gerando checklist + agenda; dashboard com progresso/prazos/chat IA; marketplace básico (listagem por categoria + filtro cidade/raio + preço + nota, sem pagamento integrado — contato via WhatsApp/e-mail/formulário interno); cadastro self-service de fornecedor com moderação manual; autenticação e-mail/senha + Google OAuth; avaliações pós-evento; web responsivo com dark/light automático conforme SO. Fora do MVP: pagamentos in-app, contratos digitais, B2B, apps nativos, matching automático avançado.

**Fase 2 — B2B + Pagamentos.** Multi-tenant (`organizations`, convites, branding leve); CRM simplificado (leads/pipeline/propostas); contratos digitais (Clicksign/D4Sign/Autentique); pagamentos in-app com split via **Pagar.me** para bookings do marketplace; assinaturas recorrentes (B2C premium e planos B2B) via **AbacatePay**; cotação instantânea (beca/anel) vs orçamento sob consulta (fotógrafo/buffet/local).

**Fase 3 — Expansão multi-evento.** Generalizar `event_types` (casamento, aniversário etc.), novas `vendor_categories` reaproveitando o mesmo schema, templates de checklist administráveis por tipo de evento.

**Fase 4 — Apps mobile nativos** (React Native/Expo reaproveitando lógica de negócio via `packages/shared-types`), push notifications nativas, câmera nativa para portfólio de fornecedores.

## Modelo de Dados de Alto Nível

Princípio orientador: nada de "colação de grau" fica hardcoded no schema — o que é específico do domínio vive em dados/configuração (`event_types`, `vendor_categories`, templates de checklist), não em estrutura de tabelas. Isso é o que permite a Fase 3 sem redesenho.

- **Identidade**: `users`; `organizations` (tenant B2B: nome, slug, branding, plano_id); `organization_members` (user_id, organization_id, role) — base do isolamento multi-tenant via RLS.
- **Eventos (generalizável)**: `event_types` (catálogo, não enum fixo: slug `colacao_de_grau`, `casamento`...); `events` (user_id, organization_id nullable, event_type_id, data_evento, cidade/geo, orçamento, status); `event_members` (para turmas/eventos compartilhados).
- **Checklist/IA**: `checklist_templates` (por event_type, versionado); `checklist_template_items` (categoria opcional, offset_dias_antes_evento); `tasks` (instância por evento, due_date calculada, origem template/IA/manual); `ai_conversations`/`ai_messages` (histórico por evento).
- **Marketplace**: `vendor_categories` (catálogo extensível: slug, modelo_matching = `preco_fixo` | `sob_consulta` | `cotacao_instantanea`); `vendors` (owner_user_id, **organization_id nullable desde o MVP** — suporta organizadora-como-vendor); `vendor_categories_map` (N:N); `vendor_locations` (lat/lng, raio_atendimento_km); `vendor_price_tables` (categorias preço fixo); `bookings` (event_id, vendor_id, status, valor); `booking_messages`; `contracts`/`payments` (Fase 2, com campo indicando gateway: pagarme|abacatepay); `reviews` (vinculada a booking_id, só pós-transação real).
- **Assinaturas**: `subscription_plans` (tipo b2c/b2b, preço, limites em JSON, gateway_ref); `subscriptions`.
- **Geo**: PostGIS (`ST_DWithin`) se o plano Supabase permitir, ou `earthdistance`/`cube` como alternativa mais simples no MVP.

## Arquitetura Técnica

**Estrutura de projeto** (Next.js App Router):
```
gradual/
├── AGENTS.md              # instruções para o Codex
├── CLAUDE.md              # instruções para Claude Code
├── docs/CONVENTIONS.md    # regras compartilhadas (fonte única de verdade)
├── docs/architecture.md   # este documento
├── apps/web/
│   ├── app/
│   │   ├── (marketing)/, (auth)/
│   │   ├── (b2c)/dashboard|checklist|eventos/[eventId]|assistente/
│   │   ├── (marketplace)/buscar|fornecedor/[vendorId]|categorias/[slug]/
│   │   ├── (b2b)/org/[orgSlug]/dashboard|crm|turmas|configuracoes/
│   │   ├── (vendor)/painel-fornecedor/
│   │   └── api/ (webhooks Pagar.me/AbacatePay, etc.)
│   ├── components/ui (shadcn), checklist/, marketplace/, b2b/
│   └── lib/db/, auth/, ai/, geo/, payments/
├── packages/db-schema/, shared-types/
```
Começar com `apps/web` único; `packages/shared-types` e `packages/db-schema` desde o início como zona compartilhada entre Claude Code e Codex.

**Dados**: Postgres via Supabase (auth, storage, realtime, RLS inclusos). **ORM: Drizzle** — SQL-like, bom controle para queries geográficas, migrations simples de revisar em PR quando duas ferramentas de IA mexem no mesmo schema. RLS como camada primária de isolamento multi-tenant, não só filtro na aplicação.

**IA**: Claude API como motor do assistente — geração do checklist inicial via structured output/tool use (retorna `tasks` estruturadas, não texto livre); chat contextual com tools (`get_event_status`, `create_task`, `reschedule_task`, busca no marketplace). Camada `lib/ai/tools/`, prompt de sistema versionado, guardrails (IA nunca escreve direto no banco, sempre via Server Actions validando permissão/tenant). Modelo mais leve para chat de suporte, modelo maior para geração inicial do checklist.

**Auth e Multi-tenancy**: Supabase Auth (e-mail/senha + Google OAuth; Apple na Fase 4). `organization_id` em `events`/`vendors` reforçado por RLS policies. Formando convidado por organizadora mantém propriedade dos próprios dados (LGPD).

Na Fase 2, `organization_members` usa os papéis `owner`, `admin` e `member`. Memberships são autovisíveis via RLS; criação da organização e gestão de membros são operações privilegiadas e transacionais, enquanto atualização do perfil/branding passa pelo cliente Supabase e é limitada a `owner`/`admin`. A associação de `events`/`vendors` a organizações só será liberada quando o fluxo de convite e propriedade do formando estiver definido.

**Geolocalização**: geo do browser ou cidade do onboarding como fallback; ranking combinando distância + score de custo-benefício (preço normalizado + nota média + nº avaliações). Mapbox vs Google Maps para toggle mapa/lista — decisão a tomar mais perto da Fase 2 (pode adiar no MVP).

**Matching por categoria**: `preco_fixo` (beca/anel — cotação quase instantânea), `sob_consulta` (fotógrafo/buffet/local — briefing → orçamento via `bookings`/`booking_messages`).

**Pagamentos (Fase 2) — decisão em aberto entre duas arquiteturas possíveis**:

- **Opção A — dois provedores por papel** (Pagar.me + AbacatePay): o split de marketplace do AbacatePay ainda está "em breve" (não pronto para produção), então **Pagar.me** ficaria com os bookings do marketplace que exigem split entre Gradual (comissão) e o fornecedor (repasse), já maduro para isso inclusive com assinaturas; e **AbacatePay** ficaria com as cobranças recorrentes 100% do Gradual (assinatura B2C premium e planos B2B SaaS), com PIX barato e API simples.
- **Opção B — provedor único (Woovi)**: a **Woovi** já tem hoje, em produção — não "em breve" — Split Pix (divisão automática entre Gradual e fornecedor, configurável via API), cobrança recorrente nativa (Pix Automático + módulo de Assinaturas) e cartão de crédito com parcelamento (Woovi Parcelado: parte via Pix + parte parcelada no cartão). É instituição de pagamento regulada pelo BACEN (código 694), participante direto do Pix. Consolidar num único provedor reduz a superfície de integração (1 webhook, 1 ledger a reconciliar) tanto para o split de marketplace quanto para as assinaturas do próprio Gradual.
- **Recomendação**: validar taxas e limites de Split Pix da Woovi para o volume esperado antes de decidir; se comparável ao custo de Pagar.me + AbacatePay somados, a Opção B (Woovi único) é arquiteturalmente mais simples e é a escolha preferencial. Manter as duas opções documentadas até essa validação comercial ser feita — ver "Riscos e Decisões em Aberto".

## Modelo de Monetização

**B2C**: Gratuito (checklist com IA básica, limite de interações/mês, marketplace completo para visualizar/contatar) vs Premium (assinatura recorrente — IA sem limite, recomendações proativas, exportação de agenda, suporte prioritário). Comissão de marketplace sobre bookings fechados via split automático, diferenciada por categoria (beca/anel com margem menor que fotógrafo/buffet, que têm ticket mais flexível). Gateway exato (Woovi único ou Pagar.me+AbacatePay) é decisão em aberto — ver seção Pagamentos.

**B2B**: Tiers recorrentes estilo HoneyBook — Starter (1 usuário, N turmas, CRM básico), Pro (múltiplos membros, propostas/contratos ilimitados, portal co-branded), Scale (múltiplas filiais, API, suporte prioritário). Comissão de marketplace reduzida para assinantes B2B como upsell quando atuarem como vendor.

**Fornecedores**: cadastro básico gratuito; planos de destaque/visibilidade paga e/ou créditos por lead (Fase 2) como receita adicional.

## Divisão de Trabalho: Claude Code x Codex

Dividir por **domínio vertical**, não por camada — cada ferramenta possui rotas/componentes/endpoints de ponta a ponta, reduzindo conflito de merge. Compartilham apenas `packages/shared-types` e `packages/db-schema`. Detalhes operacionais em `CLAUDE.md`, `AGENTS.md` e `docs/CONVENTIONS.md`.

## Segurança e Compliance

- **LGPD**: base legal clara, política de privacidade, consentimento no onboarding, direito de exclusão/portabilidade; minimizar coleta (CPF/dados sensíveis só no momento de pagamento/contrato); atenção redobrada quando a Fase 3 envolver aniversário/dados de menores (ECA + LGPD).
- **Multi-tenant**: isolamento via RLS testado com casos de "vazamento cruzado" (tenant A não lê dados de tenant B mesmo com bug de filtro na aplicação); auditoria de acesso desde a Fase 2.
- **Pagamentos**: com Pagar.me/AbacatePay usando checkout hospedado/tokenização, o Gradual nunca toca dado de cartão bruto → escopo PCI-DSS reduzido a SAQ-A. Dois provedores = duas superfícies de webhook e dois ledgers a reconciliar — validar isso com atenção na Fase 2.
- **Infra**: revisar RLS policy por tabela antes de produção; rate limiting em endpoints de IA (custo) e busca (scraping); segredos (API key Anthropic, chaves Pagar.me/AbacatePay) só server-side.
- **Conteúdo de terceiros**: moderação de portfólio/descrições de vendors antes de aprovação pública.

## Riscos e Decisões em Aberto

1. Mapa: Mapbox vs Google Maps — pode adiar no MVP.
2. Assinatura eletrônica (Fase 2): Clicksign/D4Sign/Autentique vs DocuSign.
3. PostGIS vs `earthdistance` conforme plano do Supabase.
4. Fluxo de convite de formando por organizadora (código/link de turma) — desenhar antes de implementar `event_members`.
5. Limites do plano gratuito de IA (interações/mês, medição por token ou mensagem) — impacta `ai_conversations`/billing.
6. "Gradual" é provisório — checar disponibilidade de domínio/marca formalmente (INPI) antes de investir em branding.
7. Percentual de comissão por categoria — schema já suporta variação, valor precisa validação com fornecedores-piloto.
8. Framework de testes e CI — decidir antes de abrir o repo para trabalho paralelo de duas ferramentas.
9. **Gateway de pagamento**: decidir entre Opção A (Pagar.me para split + AbacatePay para recorrência) e Opção B (Woovi único, cobrindo split via Split Pix + recorrência via Pix Automático/Assinaturas + cartão via Woovi Parcelado) — comparar taxas/limites reais para o volume esperado antes da Fase 2.

## Próximos Passos

1. ~~Criar o repositório, `CLAUDE.md`, `AGENTS.md` e `docs/CONVENTIONS.md`.~~ (feito)
2. ~~Persistir este documento em `docs/architecture.md`.~~ (feito)
3. ~~Modelar o schema inicial (`packages/db-schema`) cobrindo só o subconjunto B2C do MVP (users, event_types, events, checklist_templates/items, tasks, vendor_categories, vendors, vendor_locations, reviews).~~ (feito — schema revisado em duas rodadas pelo Codex, aprovado; migration `0000_mature_susan_delgado.sql` gerada e aplicada ao projeto Supabase real. `supabase/` inicializado localmente via CLI; `supabase login`/`link` ficaram pendentes — não são bloqueantes, a migration foi aplicada via connection string direta.)
4. ~~Prototipar o fluxo de onboarding + criação do evento/checklist~~ (feito, sem a parte de IA ainda — ver abaixo). Auth real (`components/auth/auth-form.tsx`, e-mail/senha), formulário de onboarding (`components/checklist/onboarding-form.tsx`) e `lib/events/create-event-from-onboarding.ts` criam o evento e semeiam as tasks a partir do `checklist_template` via cliente Supabase (RLS de verdade, não Drizzle). Testado ponta a ponta com Playwright contra o Supabase real: guardas de autenticação, cadastro com confirmação de e-mail, submissão do onboarding, 11 tasks renderizadas com prazos corretos, dark mode. `/dashboard` hoje é só um router (sem evento → onboarding; com evento → a página do evento) — ainda não é um dashboard de verdade.
   - **Falta**: a personalização/reordenação do checklist via Claude API (o "maior risco técnico" original) — hoje o checklist é só o template seed aplicado deterministicamente, sem IA nenhuma envolvida. `lib/ai/**` ainda não existe.
5. Definir wireframes de baixa fidelidade do dashboard B2C e da busca de marketplace (grid de cards, filtro horizontal, chips removíveis, toggle mapa/lista — padrão Airbnb) antes de codar componentes.
6. `supabase login --token <personal-access-token>` + `supabase link --project-ref mcccpktqgwvyjloeqsvv` quando algum fluxo precisar da CLI vinculada ao projeto (ex: `supabase gen types`, `supabase functions deploy`).
