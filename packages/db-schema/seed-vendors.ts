// Dev/test fixture data for the marketplace UI — NOT production seed data.
// Real vendors will come from the vendor sign-up flow (Codex's domain,
// app/(vendor)/**) once it exists. Run with: node seed-vendors.ts
import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import {
  events,
  eventTypes,
  reviews,
  users,
  vendorCategories,
  vendorCategoryLinks,
  vendorLocations,
  vendorModeration,
  vendorPriceTables,
  vendors,
} from "./schema.ts";

config({ path: "../../apps/web/.env.local" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({ connectionString });
const db = drizzle(pool);

async function ensureAuthUserAndAppUser(email: string, fullName: string) {
  const existingAuth = await pool.query<{ id: string }>("select id from auth.users where email = $1", [email]);
  const authUserId =
    existingAuth.rows[0]?.id ??
    (
      await pool.query<{ id: string }>(
        `insert into auth.users (id, email, email_confirmed_at, aud, role)
         values (gen_random_uuid(), $1, now(), 'authenticated', 'authenticated')
         returning id`,
        [email],
      )
    ).rows[0].id;

  const [existingUser] = await db.select().from(users).where(eq(users.authUserId, authUserId));
  if (existingUser) return existingUser;

  const [created] = await db
    .insert(users)
    .values({ authUserId, email, fullName })
    .returning();
  return created;
}

async function ensureVendorCategoryId(slug: string) {
  const [category] = await db.select().from(vendorCategories).where(eq(vendorCategories.slug, slug));
  if (!category) throw new Error(`vendor_category '${slug}' não existe — rode db:seed primeiro.`);
  return category.id;
}

type VendorSeed = {
  ownerEmail: string;
  ownerName: string;
  name: string;
  description: string;
  categorySlug: string;
  city: string;
  state: string;
  serviceRadiusKm: number;
  priceItems?: { label: string; price: string }[];
};

const VENDOR_SEEDS: VendorSeed[] = [
  {
    ownerEmail: "seed.studio.anara@gradual.test",
    ownerName: "Studio Anara",
    name: "Studio Anara",
    description:
      "Cobertura completa da colação de grau — making of, cerimônia e festa. Ensaio pré-evento incluso, entrega em até 20 dias.",
    categorySlug: "fotografia",
    city: "Curitiba",
    state: "PR",
    serviceRadiusKm: 40,
  },
  {
    ownerEmail: "seed.toga.real@gradual.test",
    ownerName: "Toga Real",
    name: "Toga Real",
    description: "Aluguel de beca, capelo e faixa para colação de grau, com retirada e devolução facilitadas.",
    categorySlug: "beca",
    city: "Curitiba",
    state: "PR",
    serviceRadiusKm: 25,
    priceItems: [
      { label: "Beca simples (beca + capelo)", price: "149.00" },
      { label: "Beca + faixa do curso", price: "179.00" },
      { label: "Kit completo (beca, capelo, faixa e borla extra)", price: "219.00" },
    ],
  },
  {
    ownerEmail: "seed.joalheria.cerato@gradual.test",
    ownerName: "Joalheria Cerato",
    name: "Joalheria Cerato",
    description: "Anéis de formatura sob medida, do desenho à entrega, com garantia vitalícia.",
    categorySlug: "anel-de-formatura",
    city: "São Paulo",
    state: "SP",
    serviceRadiusKm: 60,
    priceItems: [
      { label: "Anel prata 950", price: "890.00" },
      { label: "Anel ouro 10k", price: "1590.00" },
    ],
  },
  {
    ownerEmail: "seed.sabor.cia@gradual.test",
    ownerName: "Sabor & Cia Buffet",
    name: "Sabor & Cia",
    description: "Buffet completo para festa de formatura, do coquetel ao jantar, com cardápio personalizável.",
    categorySlug: "buffet",
    city: "Curitiba",
    state: "PR",
    serviceRadiusKm: 35,
  },
  {
    ownerEmail: "seed.villa.real@gradual.test",
    ownerName: "Espaço Villa Real",
    name: "Espaço Villa Real",
    description: "Espaço para cerimônia e festa com capacidade para até 300 convidados, estacionamento próprio.",
    categorySlug: "local-de-evento",
    city: "Curitiba",
    state: "PR",
    serviceRadiusKm: 20,
  },
  {
    ownerEmail: "seed.beca.express@gradual.test",
    ownerName: "Beca Express",
    name: "Beca Express",
    description: "Aluguel rápido de beca e capelo, entrega no dia anterior ao evento.",
    categorySlug: "beca",
    city: "São Paulo",
    state: "SP",
    serviceRadiusKm: 50,
    priceItems: [{ label: "Beca + capelo", price: "119.00" }],
  },
];

async function seedVendor(seed: VendorSeed) {
  const owner = await ensureAuthUserAndAppUser(seed.ownerEmail, seed.ownerName);
  const categoryId = await ensureVendorCategoryId(seed.categorySlug);

  const [existing] = await db.select().from(vendors).where(eq(vendors.ownerUserId, owner.id));
  const vendor =
    existing ??
    (
      await db
        .insert(vendors)
        .values({ ownerUserId: owner.id, displayName: seed.name, description: seed.description })
        .returning()
    )[0];

  await db.insert(vendorModeration).values({ vendorId: vendor.id, status: "aprovado" }).onConflictDoNothing();

  const [linkExists] = await db
    .select()
    .from(vendorCategoryLinks)
    .where(and(eq(vendorCategoryLinks.vendorId, vendor.id), eq(vendorCategoryLinks.vendorCategoryId, categoryId)));
  if (!linkExists) {
    await db.insert(vendorCategoryLinks).values({ vendorId: vendor.id, vendorCategoryId: categoryId });
  }

  const [locationExists] = await db.select().from(vendorLocations).where(eq(vendorLocations.vendorId, vendor.id));
  if (!locationExists) {
    await db.insert(vendorLocations).values({
      vendorId: vendor.id,
      city: seed.city,
      state: seed.state,
      serviceRadiusKm: seed.serviceRadiusKm,
    });
  }

  if (seed.priceItems && seed.priceItems.length > 0) {
    const existingPrices = await db.select().from(vendorPriceTables).where(eq(vendorPriceTables.vendorId, vendor.id));
    if (existingPrices.length === 0) {
      await db
        .insert(vendorPriceTables)
        .values(seed.priceItems.map((item) => ({ vendorId: vendor.id, vendorCategoryId: categoryId, ...item })));
    }
  }

  return vendor;
}

async function seedReview(reviewerEmail: string, reviewerName: string, vendorId: string, rating: number, comment: string) {
  const reviewer = await ensureAuthUserAndAppUser(reviewerEmail, reviewerName);

  const [colacao] = await db.select().from(eventTypes).where(eq(eventTypes.slug, "colacao_de_grau"));
  if (!colacao) throw new Error("event_type 'colacao_de_grau' não existe — rode db:seed primeiro.");

  let [event] = await db.select().from(events).where(eq(events.userId, reviewer.id));
  if (!event) {
    [event] = await db
      .insert(events)
      .values({ userId: reviewer.id, eventTypeId: colacao.id, title: `Colação de ${reviewerName}` })
      .returning();
  }

  const [existingReview] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.eventId, event.id), eq(reviews.vendorId, vendorId)));
  if (!existingReview) {
    await db.insert(reviews).values({ vendorId, eventId: event.id, authorUserId: reviewer.id, rating, comment });
  }
}

async function main() {
  const created: Record<string, string> = {};
  for (const seed of VENDOR_SEEDS) {
    const vendor = await seedVendor(seed);
    created[seed.name] = vendor.id;
    console.log(`Vendor pronto: ${seed.name} (${vendor.id})`);
  }

  await seedReview(
    "seed.reviewer.camila@gradual.test",
    "Camila R.",
    created["Studio Anara"],
    5,
    "Fotos incríveis, equipe super discreta durante a cerimônia e entrega antes do prazo.",
  );
  await seedReview(
    "seed.reviewer.bruno@gradual.test",
    "Bruno T.",
    created["Studio Anara"],
    5,
    "O vídeo highlight ficou emocionante, recomendo demais.",
  );
  await seedReview(
    "seed.reviewer.camila@gradual.test",
    "Camila R.",
    created["Toga Real"],
    4,
    "Beca de boa qualidade, retirada rápida.",
  );
  await seedReview(
    "seed.reviewer.bruno@gradual.test",
    "Bruno T.",
    created["Joalheria Cerato"],
    5,
    "Anel ficou exatamente como no desenho, atendimento excelente.",
  );

  console.log("Seed de fornecedores concluído.");
  await pool.end();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
