import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { checklistTemplateItems, checklistTemplates, eventTypes, vendorCategories } from "./schema.ts";

config({ path: "../../apps/web/.env.local" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({ connectionString });
const db = drizzle(pool);

const CATEGORY_SEEDS = [
  { slug: "beca", name: "Beca e capelo", matchingModel: "preco_fixo" as const },
  { slug: "anel-de-formatura", name: "Anel de formatura", matchingModel: "preco_fixo" as const },
  { slug: "fotografia", name: "Fotografia e filmagem", matchingModel: "sob_consulta" as const },
  { slug: "buffet", name: "Buffet", matchingModel: "sob_consulta" as const },
  { slug: "local-de-evento", name: "Local do evento", matchingModel: "sob_consulta" as const },
];

// offsetDaysBeforeEvent: positive = days before, 0 = day of, negative = after
// (see the column comment in schema.ts). Categories left unset are
// general/organizational tasks with no single fornecedor category.
const CHECKLIST_ITEM_SEEDS = [
  { title: "Definir orçamento e decidir se vai organizar com a turma", offsetDaysBeforeEvent: 180, sortOrder: 0 },
  { title: "Pesquisar e reservar fotógrafo/filmagem", offsetDaysBeforeEvent: 150, sortOrder: 1, categorySlug: "fotografia" },
  { title: "Encomendar o anel de formatura", offsetDaysBeforeEvent: 120, sortOrder: 2, categorySlug: "anel-de-formatura" },
  { title: "Fechar o buffet", offsetDaysBeforeEvent: 90, sortOrder: 3, categorySlug: "buffet" },
  { title: "Reservar o local do evento", offsetDaysBeforeEvent: 90, sortOrder: 4, categorySlug: "local-de-evento" },
  { title: "Reservar a beca e o capelo", offsetDaysBeforeEvent: 60, sortOrder: 5, categorySlug: "beca" },
  { title: "Fechar a lista de convidados", offsetDaysBeforeEvent: 45, sortOrder: 6 },
  { title: "Confirmar detalhes com todos os fornecedores contratados", offsetDaysBeforeEvent: 15, sortOrder: 7 },
  { title: "Retirar a beca", offsetDaysBeforeEvent: 7, sortOrder: 8, categorySlug: "beca" },
  { title: "Colação de grau", offsetDaysBeforeEvent: 0, sortOrder: 9 },
  { title: "Avaliar os fornecedores contratados", offsetDaysBeforeEvent: -3, sortOrder: 10 },
];

async function ensureEventType() {
  const [existing] = await db
    .select()
    .from(eventTypes)
    .where(eq(eventTypes.slug, "colacao_de_grau"));
  if (existing) return existing;

  const [created] = await db
    .insert(eventTypes)
    .values({ slug: "colacao_de_grau", name: "Colação de Grau" })
    .returning();
  return created;
}

async function ensureCategories(eventTypeId: string) {
  const categoryIdBySlug: Record<string, string> = {};

  for (const seed of CATEGORY_SEEDS) {
    const [existing] = await db
      .select()
      .from(vendorCategories)
      .where(and(eq(vendorCategories.eventTypeId, eventTypeId), eq(vendorCategories.slug, seed.slug)));

    if (existing) {
      categoryIdBySlug[seed.slug] = existing.id;
      continue;
    }

    const [created] = await db
      .insert(vendorCategories)
      .values({ eventTypeId, ...seed })
      .returning();
    categoryIdBySlug[seed.slug] = created.id;
  }

  return categoryIdBySlug;
}

async function ensureChecklistTemplate(eventTypeId: string, categoryIdBySlug: Record<string, string>) {
  const [existing] = await db
    .select()
    .from(checklistTemplates)
    .where(and(eq(checklistTemplates.eventTypeId, eventTypeId), eq(checklistTemplates.version, 1)));

  if (existing) {
    console.log("Checklist template já existe, pulando itens.");
    return;
  }

  const [template] = await db
    .insert(checklistTemplates)
    .values({ eventTypeId, name: "Checklist padrão — Colação de Grau", version: 1 })
    .returning();

  await db.insert(checklistTemplateItems).values(
    CHECKLIST_ITEM_SEEDS.map(({ categorySlug, ...item }) => ({
      templateId: template.id,
      vendorCategoryId: categorySlug ? categoryIdBySlug[categorySlug] : undefined,
      ...item,
    })),
  );
}

async function main() {
  const eventType = await ensureEventType();
  const categoryIdBySlug = await ensureCategories(eventType.id);
  await ensureChecklistTemplate(eventType.id, categoryIdBySlug);

  console.log("Seed concluído.");
  await pool.end();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
