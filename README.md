# Gradual

Monorepo do Gradual, construído com Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui e Drizzle ORM sobre Postgres/Supabase.

## Pré-requisitos

- Node.js 20.9 ou superior
- npm 10 ou superior
- Um projeto Supabase para operações de banco de dados

## Desenvolvimento local

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `apps/web/.env.local` e substitua `DATABASE_URL` pela connection string do seu projeto Supabase. O app e os comandos do Drizzle usam esse mesmo arquivo local.

3. Inicie a aplicação:

   ```bash
   npm run dev
   ```

A aplicação estará disponível em `http://localhost:3000`.

## Comandos

- `npm run build`: cria o build de produção.
- `npm run lint`: executa o ESLint no app web.
- `npm run typecheck`: valida os tipos de todos os workspaces.
- `npm run db:generate`: gera uma migration a partir do schema Drizzle.
- `npm run db:migrate`: aplica as migrations usando `DATABASE_URL`.
- `npm run db:studio`: abre o Drizzle Studio.

As migrations devem seguir as regras de [`docs/CONVENTIONS.md`](./docs/CONVENTIONS.md): uma migration por PR e nenhuma alteração em migrations já mergeadas.
