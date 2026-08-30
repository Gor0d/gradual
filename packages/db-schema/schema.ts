import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { anonRole, authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authUserId: uuid("auth_user_id")
      .notNull()
      .unique()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    email: text("email").notNull().unique(),
    fullName: text("full_name"),
    phone: text("phone"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy("users_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.authUserId} = ${authUid}`,
    }),
    pgPolicy("users_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.authUserId} = ${authUid}`,
    }),
    pgPolicy("users_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.authUserId} = ${authUid}`,
      withCheck: sql`${table.authUserId} = ${authUid}`,
    }),
  ],
).enableRLS();

// Resolves the app-level `users.id` for the currently authenticated request.
// Reused across every policy below instead of repeating the subquery.
const authenticatedUserId = sql`(select ${users.id} from ${users} where ${users.authUserId} = ${authUid})`;

// Tenant membership is intentionally self-readable. This is enough for RLS
// checks without exposing the organization roster; member administration is
// introduced through privileged, explicitly authorized server operations.
export const organizationMemberRoleEnum = pgEnum("organization_member_role", [
  "owner",
  "admin",
  "member",
]);

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references((): AnyPgColumn => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: organizationMemberRoleEnum("role").notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("organization_members_organization_id_user_id_idx").on(
      table.organizationId,
      table.userId,
    ),
    index("organization_members_user_id_idx").on(table.userId),
    pgPolicy("organization_members_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authenticatedUserId}`,
    }),
  ],
).enableRLS();

export type OrganizationBranding = {
  logoUrl?: string;
  primaryColor?: string;
};

// Creation/deletion and membership writes are privileged operations through
// Drizzle after server-side authorization. Regular members only read their
// tenant; owner/admin may update its profile through Supabase so RLS applies.
export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    branding: jsonb("branding").$type<OrganizationBranding>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("organizations_name_not_blank", sql`char_length(trim(${table.name})) > 0`),
    check(
      "organizations_slug_format",
      sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(${table.slug}) between 3 and 63`,
    ),
    pgPolicy("organizations_select_member", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from ${organizationMembers}
        where ${organizationMembers.organizationId} = ${table.id}
          and ${organizationMembers.userId} = ${authenticatedUserId}
      )`,
    }),
    pgPolicy("organizations_update_admin", {
      for: "update",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from ${organizationMembers}
        where ${organizationMembers.organizationId} = ${table.id}
          and ${organizationMembers.userId} = ${authenticatedUserId}
          and ${organizationMembers.role} in ('owner', 'admin')
      )`,
      withCheck: sql`exists (
        select 1 from ${organizationMembers}
        where ${organizationMembers.organizationId} = ${table.id}
          and ${organizationMembers.userId} = ${authenticatedUserId}
          and ${organizationMembers.role} in ('owner', 'admin')
      )`,
    }),
  ],
).enableRLS();

// ---------------------------------------------------------------------------
// Events (generalizable across verticals — see docs/architecture.md)
// ---------------------------------------------------------------------------

// Catalog, not an enum: new event types (casamento, aniversário...) are rows,
// not schema changes.
export const eventTypes = pgTable(
  "event_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    pgPolicy("event_types_select_all", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`${table.isActive} = true`,
    }),
  ],
).enableRLS();

export const eventStatusEnum = pgEnum("event_status", [
  "planejamento",
  "confirmado",
  "concluido",
  "cancelado",
]);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    eventTypeId: uuid("event_type_id")
      .notNull()
      .references(() => eventTypes.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    eventDate: timestamp("event_date", { withTimezone: true }),
    city: text("city"),
    state: text("state"),
    estimatedBudget: numeric("estimated_budget", { precision: 12, scale: 2 }),
    status: eventStatusEnum("status").notNull().default("planejamento"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("events_user_id_idx").on(table.userId),
    index("events_organization_id_idx").on(table.organizationId),
    pgPolicy("events_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authenticatedUserId}`,
    }),
    // MVP: no membership validation exists yet, so a regular user can never
    // attach their event to an organization — that would let the row
    // surface in the wrong tenant once Fase 2 ships org-scoped access.
    pgPolicy("events_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authenticatedUserId} and ${table.organizationId} is null`,
    }),
    pgPolicy("events_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authenticatedUserId} and ${table.organizationId} is null`,
      withCheck: sql`${table.userId} = ${authenticatedUserId} and ${table.organizationId} is null`,
    }),
    pgPolicy("events_delete_own", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authenticatedUserId}`,
    }),
  ],
).enableRLS();

// Shared/turma membership. Kept deliberately self-scoped for now (a member
// only sees their own row, not the full roster) — the invite flow that
// should drive owner-side roster access is still an open decision, see
// docs/architecture.md "Riscos e Decisões em Aberto", item 4.
export const eventMemberRoleEnum = pgEnum("event_member_role", ["owner", "membro"]);

export const eventMembers = pgTable(
  "event_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: eventMemberRoleEnum("role").notNull().default("membro"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("event_members_event_id_user_id_idx").on(table.eventId, table.userId),
    pgPolicy("event_members_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authenticatedUserId}`,
    }),
  ],
).enableRLS();

// ---------------------------------------------------------------------------
// Checklist / IA
// ---------------------------------------------------------------------------

// Managed by service role / admin tooling for the MVP (no self-service
// authoring UI yet) — every authenticated user can read the active ones.
export const checklistTemplates = pgTable(
  "checklist_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventTypeId: uuid("event_type_id")
      .notNull()
      .references(() => eventTypes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    version: integer("version").notNull().default(1),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy("checklist_templates_select_active", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.isActive} = true`,
    }),
  ],
).enableRLS();

// ---------------------------------------------------------------------------
// Marketplace — declared before checklist_template_items/tasks so their RLS
// policies can reference vendor_categories directly.
// ---------------------------------------------------------------------------

export const vendorMatchingModelEnum = pgEnum("vendor_matching_model", [
  "preco_fixo",
  "sob_consulta",
  "cotacao_instantanea",
]);

// Catalog, not an enum — see event_types. `event_type_id` is nullable so a
// category can apply across verticals once Fase 3 adds more event types.
// Two partial unique indexes (instead of one over both columns) because a
// plain composite unique index treats every NULL event_type_id as distinct,
// so it would silently allow duplicate slugs among global categories.
export const vendorCategories = pgTable(
  "vendor_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventTypeId: uuid("event_type_id").references(() => eventTypes.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    matchingModel: vendorMatchingModelEnum("matching_model").notNull().default("sob_consulta"),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    uniqueIndex("vendor_categories_event_type_id_slug_idx")
      .on(table.eventTypeId, table.slug)
      .where(sql`${table.eventTypeId} is not null`),
    uniqueIndex("vendor_categories_global_slug_idx")
      .on(table.slug)
      .where(sql`${table.eventTypeId} is null`),
    pgPolicy("vendor_categories_select_all", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`${table.isActive} = true`,
    }),
  ],
).enableRLS();

export const checklistTemplateItems = pgTable(
  "checklist_template_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => checklistTemplates.id, { onDelete: "cascade" }),
    vendorCategoryId: uuid("vendor_category_id").references(() => vendorCategories.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description"),
    // Positive = days before the event, 0 = day of the event, negative =
    // after the event (ex: "avaliar fornecedores"), all without a separate
    // column.
    offsetDaysBeforeEvent: integer("offset_days_before_event").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    index("checklist_template_items_template_id_idx").on(table.templateId),
    pgPolicy("checklist_template_items_select_active_template", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists (select 1 from ${checklistTemplates} where ${checklistTemplates.id} = ${table.templateId} and ${checklistTemplates.isActive} = true)`,
    }),
  ],
).enableRLS();

export const taskStatusEnum = pgEnum("task_status", [
  "pendente",
  "em_andamento",
  "concluida",
  "cancelada",
]);
export const taskOriginEnum = pgEnum("task_origin", ["template", "ai", "manual"]);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    vendorCategoryId: uuid("vendor_category_id").references(() => vendorCategories.id, {
      onDelete: "set null",
    }),
    templateItemId: uuid("template_item_id").references(() => checklistTemplateItems.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    status: taskStatusEnum("status").notNull().default("pendente"),
    origin: taskOriginEnum("origin").notNull().default("manual"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("tasks_event_id_idx").on(table.eventId),
    pgPolicy("tasks_all_own_event", {
      for: "all",
      to: authenticatedRole,
      using: sql`exists (select 1 from ${events} where ${events.id} = ${table.eventId} and ${events.userId} = ${authenticatedUserId})`,
      withCheck: sql`exists (select 1 from ${events} where ${events.id} = ${table.eventId} and ${events.userId} = ${authenticatedUserId})`,
    }),
  ],
).enableRLS();

// ---------------------------------------------------------------------------
// Assistente de IA
// ---------------------------------------------------------------------------

export const aiConversations = pgTable(
  "ai_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("ai_conversations_event_id_idx").on(table.eventId),
    // No update/delete policy: a `for: "all"` policy here would let a user
    // delete their own conversation, which cascades to ai_messages and
    // erases the immutable history that ai_messages' own RLS protects.
    // LGPD-driven deletion goes through a privileged, audited Server Action
    // instead.
    pgPolicy("ai_conversations_select_own_event", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists (select 1 from ${events} where ${events.id} = ${table.eventId} and ${events.userId} = ${authenticatedUserId})`,
    }),
    pgPolicy("ai_conversations_insert_own_event", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`exists (select 1 from ${events} where ${events.id} = ${table.eventId} and ${events.userId} = ${authenticatedUserId})`,
    }),
  ],
).enableRLS();

export const aiMessageRoleEnum = pgEnum("ai_message_role", ["user", "assistant", "system", "tool"]);

export const aiMessages = pgTable(
  "ai_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => aiConversations.id, { onDelete: "cascade" }),
    role: aiMessageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    // Tool-use payloads (ex: create_task, reschedule_task) — structured, so
    // the assistant never writes to the domain tables directly.
    toolCalls: jsonb("tool_calls"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("ai_messages_conversation_id_idx").on(table.conversationId),
    pgPolicy("ai_messages_select_own_conversation", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from ${aiConversations}
        join ${events} on ${events.id} = ${aiConversations.eventId}
        where ${aiConversations.id} = ${table.conversationId} and ${events.userId} = ${authenticatedUserId}
      )`,
    }),
    // Only `role = 'user'` with no tool_calls can be inserted by the
    // client. Assistant/system/tool messages — and any tool_calls payload —
    // are written by a privileged (service-role) Server Action after
    // calling the model, so history/tool calls can't be forged from the
    // client. No update/delete policy — messages are immutable once
    // written.
    pgPolicy("ai_messages_insert_own_user_message", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.role} = 'user' and ${table.toolCalls} is null and exists (
        select 1 from ${aiConversations}
        join ${events} on ${events.id} = ${aiConversations.eventId}
        where ${aiConversations.id} = ${table.conversationId} and ${events.userId} = ${authenticatedUserId}
      )`,
    }),
  ],
).enableRLS();

// ---------------------------------------------------------------------------
// Fornecedores
// ---------------------------------------------------------------------------

export const vendorStatusEnum = pgEnum("vendor_status", ["pendente", "aprovado", "suspenso"]);

// Moderation state lives outside `vendors` on purpose: RLS can't compare a
// row's OLD vs NEW value, so an owner with UPDATE on `vendors` could set
// their own `status` straight to 'aprovado' if it lived there. By keeping it
// in a table the owner has no insert/update policy for, only the service
// role (moderation tooling) can ever change it.
//
// The vendor-creation Server Action must insert this row (status =
// 'pendente') and the `vendors` row in the same server-side transaction,
// using the service-role client only after explicitly validating the
// caller's identity — never split across two requests. Otherwise a `vendors`
// insert without a matching `vendor_moderation` row is possible: it won't
// become public (the select policy requires an 'aprovado' row to exist),
// but it leaves an orphaned, unmoderatable record behind.
export const vendorModeration = pgTable(
  "vendor_moderation",
  {
    vendorId: uuid("vendor_id")
      .primaryKey()
      .references((): AnyPgColumn => vendors.id, { onDelete: "cascade" }),
    status: vendorStatusEnum("status").notNull().default("pendente"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  () => [
    // Status isn't sensitive on its own (just workflow state); gating the
    // actual profile content is `vendors`' own select policy below.
    pgPolicy("vendor_moderation_select_all", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS();

// `organization_id` nullable from day one — an organizadora (Fase 2) can own
// a vendor profile without redesigning this table, per docs/architecture.md.
export const vendors = pgTable(
  "vendors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    displayName: text("display_name").notNull(),
    description: text("description"),
    portfolioUrls: jsonb("portfolio_urls").notNull().default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("vendors_owner_user_id_idx").on(table.ownerUserId),
    pgPolicy("vendors_select_public_approved", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`exists (select 1 from ${vendorModeration} where ${vendorModeration.vendorId} = ${table.id} and ${vendorModeration.status} = 'aprovado')`,
    }),
    pgPolicy("vendors_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.ownerUserId} = ${authenticatedUserId}`,
    }),
    // See the organization_id note on `events` above — same MVP restriction.
    pgPolicy("vendors_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.ownerUserId} = ${authenticatedUserId} and ${table.organizationId} is null`,
    }),
    pgPolicy("vendors_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.ownerUserId} = ${authenticatedUserId} and ${table.organizationId} is null`,
      withCheck: sql`${table.ownerUserId} = ${authenticatedUserId} and ${table.organizationId} is null`,
    }),
  ],
).enableRLS();

export const vendorCategoryLinks = pgTable(
  "vendor_category_links",
  {
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    vendorCategoryId: uuid("vendor_category_id")
      .notNull()
      .references(() => vendorCategories.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("vendor_category_links_pk").on(table.vendorId, table.vendorCategoryId),
    pgPolicy("vendor_category_links_select_public_or_own", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`exists (
        select 1 from ${vendors}
        left join ${vendorModeration} on ${vendorModeration.vendorId} = ${vendors.id}
        where ${vendors.id} = ${table.vendorId}
          and (${vendorModeration.status} = 'aprovado' or ${vendors.ownerUserId} = ${authenticatedUserId})
      )`,
    }),
    pgPolicy("vendor_category_links_manage_own", {
      for: "all",
      to: authenticatedRole,
      using: sql`exists (select 1 from ${vendors} where ${vendors.id} = ${table.vendorId} and ${vendors.ownerUserId} = ${authenticatedUserId})`,
      withCheck: sql`exists (select 1 from ${vendors} where ${vendors.id} = ${table.vendorId} and ${vendors.ownerUserId} = ${authenticatedUserId})`,
    }),
  ],
).enableRLS();

export const vendorLocations = pgTable(
  "vendor_locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    city: text("city").notNull(),
    state: text("state").notNull(),
    latitude: numeric("latitude", { precision: 9, scale: 6 }),
    longitude: numeric("longitude", { precision: 9, scale: 6 }),
    serviceRadiusKm: integer("service_radius_km").notNull().default(30),
  },
  (table) => [
    index("vendor_locations_vendor_id_idx").on(table.vendorId),
    check("vendor_locations_latitude_range", sql`${table.latitude} is null or ${table.latitude} between -90 and 90`),
    check(
      "vendor_locations_longitude_range",
      sql`${table.longitude} is null or ${table.longitude} between -180 and 180`,
    ),
    check("vendor_locations_service_radius_non_negative", sql`${table.serviceRadiusKm} >= 0`),
    pgPolicy("vendor_locations_select_public_or_own", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`exists (
        select 1 from ${vendors}
        left join ${vendorModeration} on ${vendorModeration.vendorId} = ${vendors.id}
        where ${vendors.id} = ${table.vendorId}
          and (${vendorModeration.status} = 'aprovado' or ${vendors.ownerUserId} = ${authenticatedUserId})
      )`,
    }),
    pgPolicy("vendor_locations_manage_own", {
      for: "all",
      to: authenticatedRole,
      using: sql`exists (select 1 from ${vendors} where ${vendors.id} = ${table.vendorId} and ${vendors.ownerUserId} = ${authenticatedUserId})`,
      withCheck: sql`exists (select 1 from ${vendors} where ${vendors.id} = ${table.vendorId} and ${vendors.ownerUserId} = ${authenticatedUserId})`,
    }),
  ],
).enableRLS();

// Only for vendor_categories with matching_model = 'preco_fixo' (beca, anel)
// — enforced in the Server Action, not at the DB level, since it depends on
// a joined row rather than a column on this table.
export const vendorPriceTables = pgTable(
  "vendor_price_tables",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    vendorCategoryId: uuid("vendor_category_id")
      .notNull()
      .references(() => vendorCategories.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("vendor_price_tables_vendor_id_idx").on(table.vendorId),
    check("vendor_price_tables_price_non_negative", sql`${table.price} >= 0`),
    pgPolicy("vendor_price_tables_select_public_or_own", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`exists (
        select 1 from ${vendors}
        left join ${vendorModeration} on ${vendorModeration.vendorId} = ${vendors.id}
        where ${vendors.id} = ${table.vendorId}
          and (${vendorModeration.status} = 'aprovado' or ${vendors.ownerUserId} = ${authenticatedUserId})
      )`,
    }),
    pgPolicy("vendor_price_tables_manage_own", {
      for: "all",
      to: authenticatedRole,
      using: sql`exists (select 1 from ${vendors} where ${vendors.id} = ${table.vendorId} and ${vendors.ownerUserId} = ${authenticatedUserId})`,
      withCheck: sql`exists (select 1 from ${vendors} where ${vendors.id} = ${table.vendorId} and ${vendors.ownerUserId} = ${authenticatedUserId})`,
    }),
  ],
).enableRLS();

// No `booking_id` yet — Fase 1 has no in-app transaction to hang a review
// off of. Fase 2 adds `bookings` and this table gains a nullable
// `booking_id`, per docs/architecture.md.
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("reviews_event_id_vendor_id_idx").on(table.eventId, table.vendorId),
    index("reviews_vendor_id_idx").on(table.vendorId),
    check("reviews_rating_range", sql`${table.rating} between 1 and 5`),
    pgPolicy("reviews_select_all", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
    pgPolicy("reviews_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.authorUserId} = ${authenticatedUserId} and exists (select 1 from ${events} where ${events.id} = ${table.eventId} and ${events.userId} = ${authenticatedUserId})`,
    }),
    // withCheck re-validates event ownership against the *new* event_id —
    // without it, a valid review could be re-pointed at another user's
    // event by updating `event_id` alone.
    pgPolicy("reviews_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.authorUserId} = ${authenticatedUserId}`,
      withCheck: sql`${table.authorUserId} = ${authenticatedUserId} and exists (select 1 from ${events} where ${events.id} = ${table.eventId} and ${events.userId} = ${authenticatedUserId})`,
    }),
    pgPolicy("reviews_delete_own", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.authorUserId} = ${authenticatedUserId}`,
    }),
  ],
).enableRLS();
