CREATE TYPE "public"."ai_message_role" AS ENUM('user', 'assistant', 'system', 'tool');--> statement-breakpoint
CREATE TYPE "public"."event_member_role" AS ENUM('owner', 'membro');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('planejamento', 'confirmado', 'concluido', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."task_origin" AS ENUM('template', 'ai', 'manual');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('pendente', 'em_andamento', 'concluida', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."vendor_matching_model" AS ENUM('preco_fixo', 'sob_consulta', 'cotacao_instantanea');--> statement-breakpoint
CREATE TYPE "public"."vendor_status" AS ENUM('pendente', 'aprovado', 'suspenso');--> statement-breakpoint
CREATE TABLE "ai_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_conversations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ai_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" "ai_message_role" NOT NULL,
	"content" text NOT NULL,
	"tool_calls" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "checklist_template_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"vendor_category_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"offset_days_before_event" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "checklist_template_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "checklist_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type_id" uuid NOT NULL,
	"name" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "checklist_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "event_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "event_member_role" DEFAULT 'membro' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "event_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "event_types_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "event_types" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid,
	"event_type_id" uuid NOT NULL,
	"title" text NOT NULL,
	"event_date" timestamp with time zone,
	"city" text,
	"state" text,
	"estimated_budget" numeric(12, 2),
	"status" "event_status" DEFAULT 'planejamento' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"author_user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_rating_range" CHECK ("reviews"."rating" between 1 and 5)
);
--> statement-breakpoint
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"vendor_category_id" uuid,
	"template_item_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"due_date" timestamp with time zone,
	"status" "task_status" DEFAULT 'pendente' NOT NULL,
	"origin" "task_origin" DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"phone" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_auth_user_id_unique" UNIQUE("auth_user_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vendor_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type_id" uuid,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"matching_model" "vendor_matching_model" DEFAULT 'sob_consulta' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vendor_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vendor_category_links" (
	"vendor_id" uuid NOT NULL,
	"vendor_category_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vendor_category_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vendor_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"service_radius_km" integer DEFAULT 30 NOT NULL,
	CONSTRAINT "vendor_locations_latitude_range" CHECK ("vendor_locations"."latitude" is null or "vendor_locations"."latitude" between -90 and 90),
	CONSTRAINT "vendor_locations_longitude_range" CHECK ("vendor_locations"."longitude" is null or "vendor_locations"."longitude" between -180 and 180),
	CONSTRAINT "vendor_locations_service_radius_non_negative" CHECK ("vendor_locations"."service_radius_km" >= 0)
);
--> statement-breakpoint
ALTER TABLE "vendor_locations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vendor_moderation" (
	"vendor_id" uuid PRIMARY KEY NOT NULL,
	"status" "vendor_status" DEFAULT 'pendente' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vendor_moderation" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vendor_price_tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"vendor_category_id" uuid NOT NULL,
	"label" text NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_price_tables_price_non_negative" CHECK ("vendor_price_tables"."price" >= 0)
);
--> statement-breakpoint
ALTER TABLE "vendor_price_tables" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"organization_id" uuid,
	"display_name" text NOT NULL,
	"description" text,
	"portfolio_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vendors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_template_items" ADD CONSTRAINT "checklist_template_items_template_id_checklist_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."checklist_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_template_items" ADD CONSTRAINT "checklist_template_items_vendor_category_id_vendor_categories_id_fk" FOREIGN KEY ("vendor_category_id") REFERENCES "public"."vendor_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_templates" ADD CONSTRAINT "checklist_templates_event_type_id_event_types_id_fk" FOREIGN KEY ("event_type_id") REFERENCES "public"."event_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_members" ADD CONSTRAINT "event_members_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_members" ADD CONSTRAINT "event_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_event_type_id_event_types_id_fk" FOREIGN KEY ("event_type_id") REFERENCES "public"."event_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_vendor_category_id_vendor_categories_id_fk" FOREIGN KEY ("vendor_category_id") REFERENCES "public"."vendor_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_template_item_id_checklist_template_items_id_fk" FOREIGN KEY ("template_item_id") REFERENCES "public"."checklist_template_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_auth_user_id_users_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_categories" ADD CONSTRAINT "vendor_categories_event_type_id_event_types_id_fk" FOREIGN KEY ("event_type_id") REFERENCES "public"."event_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_category_links" ADD CONSTRAINT "vendor_category_links_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_category_links" ADD CONSTRAINT "vendor_category_links_vendor_category_id_vendor_categories_id_fk" FOREIGN KEY ("vendor_category_id") REFERENCES "public"."vendor_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_locations" ADD CONSTRAINT "vendor_locations_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_moderation" ADD CONSTRAINT "vendor_moderation_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_price_tables" ADD CONSTRAINT "vendor_price_tables_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_price_tables" ADD CONSTRAINT "vendor_price_tables_vendor_category_id_vendor_categories_id_fk" FOREIGN KEY ("vendor_category_id") REFERENCES "public"."vendor_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_conversations_event_id_idx" ON "ai_conversations" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "ai_messages_conversation_id_idx" ON "ai_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "checklist_template_items_template_id_idx" ON "checklist_template_items" USING btree ("template_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_members_event_id_user_id_idx" ON "event_members" USING btree ("event_id","user_id");--> statement-breakpoint
CREATE INDEX "events_user_id_idx" ON "events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "events_organization_id_idx" ON "events" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_event_id_vendor_id_idx" ON "reviews" USING btree ("event_id","vendor_id");--> statement-breakpoint
CREATE INDEX "reviews_vendor_id_idx" ON "reviews" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "tasks_event_id_idx" ON "tasks" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_categories_event_type_id_slug_idx" ON "vendor_categories" USING btree ("event_type_id","slug") WHERE "vendor_categories"."event_type_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_categories_global_slug_idx" ON "vendor_categories" USING btree ("slug") WHERE "vendor_categories"."event_type_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_category_links_pk" ON "vendor_category_links" USING btree ("vendor_id","vendor_category_id");--> statement-breakpoint
CREATE INDEX "vendor_locations_vendor_id_idx" ON "vendor_locations" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_price_tables_vendor_id_idx" ON "vendor_price_tables" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendors_owner_user_id_idx" ON "vendors" USING btree ("owner_user_id");--> statement-breakpoint
CREATE POLICY "ai_conversations_select_own_event" ON "ai_conversations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from "events" where "events"."id" = "ai_conversations"."event_id" and "events"."user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "ai_conversations_insert_own_event" ON "ai_conversations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (select 1 from "events" where "events"."id" = "ai_conversations"."event_id" and "events"."user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "ai_messages_select_own_conversation" ON "ai_messages" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
        select 1 from "ai_conversations"
        join "events" on "events"."id" = "ai_conversations"."event_id"
        where "ai_conversations"."id" = "ai_messages"."conversation_id" and "events"."user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid()))
      ));--> statement-breakpoint
CREATE POLICY "ai_messages_insert_own_user_message" ON "ai_messages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("ai_messages"."role" = 'user' and "ai_messages"."tool_calls" is null and exists (
        select 1 from "ai_conversations"
        join "events" on "events"."id" = "ai_conversations"."event_id"
        where "ai_conversations"."id" = "ai_messages"."conversation_id" and "events"."user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid()))
      ));--> statement-breakpoint
CREATE POLICY "checklist_template_items_select_active_template" ON "checklist_template_items" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from "checklist_templates" where "checklist_templates"."id" = "checklist_template_items"."template_id" and "checklist_templates"."is_active" = true));--> statement-breakpoint
CREATE POLICY "checklist_templates_select_active" ON "checklist_templates" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("checklist_templates"."is_active" = true);--> statement-breakpoint
CREATE POLICY "event_members_select_own" ON "event_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("event_members"."user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "event_types_select_all" ON "event_types" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("event_types"."is_active" = true);--> statement-breakpoint
CREATE POLICY "events_select_own" ON "events" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("events"."user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "events_insert_own" ON "events" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("events"."user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid())) and "events"."organization_id" is null);--> statement-breakpoint
CREATE POLICY "events_update_own" ON "events" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("events"."user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid())) and "events"."organization_id" is null) WITH CHECK ("events"."user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid())) and "events"."organization_id" is null);--> statement-breakpoint
CREATE POLICY "events_delete_own" ON "events" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("events"."user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "reviews_select_all" ON "reviews" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "reviews_insert_own" ON "reviews" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("reviews"."author_user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid())) and exists (select 1 from "events" where "events"."id" = "reviews"."event_id" and "events"."user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "reviews_update_own" ON "reviews" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("reviews"."author_user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid()))) WITH CHECK ("reviews"."author_user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid())) and exists (select 1 from "events" where "events"."id" = "reviews"."event_id" and "events"."user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "reviews_delete_own" ON "reviews" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("reviews"."author_user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "tasks_all_own_event" ON "tasks" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (select 1 from "events" where "events"."id" = "tasks"."event_id" and "events"."user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid())))) WITH CHECK (exists (select 1 from "events" where "events"."id" = "tasks"."event_id" and "events"."user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "users_select_own" ON "users" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("users"."auth_user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "users_insert_own" ON "users" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("users"."auth_user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "users_update_own" ON "users" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("users"."auth_user_id" = (select auth.uid())) WITH CHECK ("users"."auth_user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "vendor_categories_select_all" ON "vendor_categories" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("vendor_categories"."is_active" = true);--> statement-breakpoint
CREATE POLICY "vendor_category_links_select_public_or_own" ON "vendor_category_links" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (exists (
        select 1 from "vendors"
        left join "vendor_moderation" on "vendor_moderation"."vendor_id" = "vendors"."id"
        where "vendors"."id" = "vendor_category_links"."vendor_id"
          and ("vendor_moderation"."status" = 'aprovado' or "vendors"."owner_user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid())))
      ));--> statement-breakpoint
CREATE POLICY "vendor_category_links_manage_own" ON "vendor_category_links" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (select 1 from "vendors" where "vendors"."id" = "vendor_category_links"."vendor_id" and "vendors"."owner_user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid())))) WITH CHECK (exists (select 1 from "vendors" where "vendors"."id" = "vendor_category_links"."vendor_id" and "vendors"."owner_user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "vendor_locations_select_public_or_own" ON "vendor_locations" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (exists (
        select 1 from "vendors"
        left join "vendor_moderation" on "vendor_moderation"."vendor_id" = "vendors"."id"
        where "vendors"."id" = "vendor_locations"."vendor_id"
          and ("vendor_moderation"."status" = 'aprovado' or "vendors"."owner_user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid())))
      ));--> statement-breakpoint
CREATE POLICY "vendor_locations_manage_own" ON "vendor_locations" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (select 1 from "vendors" where "vendors"."id" = "vendor_locations"."vendor_id" and "vendors"."owner_user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid())))) WITH CHECK (exists (select 1 from "vendors" where "vendors"."id" = "vendor_locations"."vendor_id" and "vendors"."owner_user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "vendor_moderation_select_all" ON "vendor_moderation" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "vendor_price_tables_select_public_or_own" ON "vendor_price_tables" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (exists (
        select 1 from "vendors"
        left join "vendor_moderation" on "vendor_moderation"."vendor_id" = "vendors"."id"
        where "vendors"."id" = "vendor_price_tables"."vendor_id"
          and ("vendor_moderation"."status" = 'aprovado' or "vendors"."owner_user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid())))
      ));--> statement-breakpoint
CREATE POLICY "vendor_price_tables_manage_own" ON "vendor_price_tables" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (select 1 from "vendors" where "vendors"."id" = "vendor_price_tables"."vendor_id" and "vendors"."owner_user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid())))) WITH CHECK (exists (select 1 from "vendors" where "vendors"."id" = "vendor_price_tables"."vendor_id" and "vendors"."owner_user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "vendors_select_public_approved" ON "vendors" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (exists (select 1 from "vendor_moderation" where "vendor_moderation"."vendor_id" = "vendors"."id" and "vendor_moderation"."status" = 'aprovado'));--> statement-breakpoint
CREATE POLICY "vendors_select_own" ON "vendors" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("vendors"."owner_user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "vendors_insert_own" ON "vendors" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("vendors"."owner_user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid())) and "vendors"."organization_id" is null);--> statement-breakpoint
CREATE POLICY "vendors_update_own" ON "vendors" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("vendors"."owner_user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid())) and "vendors"."organization_id" is null) WITH CHECK ("vendors"."owner_user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid())) and "vendors"."organization_id" is null);