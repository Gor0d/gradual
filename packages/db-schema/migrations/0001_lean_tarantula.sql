CREATE TYPE "public"."organization_member_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TABLE "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "organization_member_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "branding" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_members_organization_id_user_id_idx" ON "organization_members" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "organization_members_user_id_idx" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_name_not_blank" CHECK (char_length(trim("organizations"."name")) > 0);--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_slug_format" CHECK ("organizations"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length("organizations"."slug") between 3 and 63);--> statement-breakpoint
CREATE POLICY "organizations_select_member" ON "organizations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
        select 1 from "organization_members"
        where "organization_members"."organization_id" = "organizations"."id"
          and "organization_members"."user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid()))
      ));--> statement-breakpoint
CREATE POLICY "organizations_update_admin" ON "organizations" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
        select 1 from "organization_members"
        where "organization_members"."organization_id" = "organizations"."id"
          and "organization_members"."user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid()))
          and "organization_members"."role" in ('owner', 'admin')
      )) WITH CHECK (exists (
        select 1 from "organization_members"
        where "organization_members"."organization_id" = "organizations"."id"
          and "organization_members"."user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid()))
          and "organization_members"."role" in ('owner', 'admin')
      ));--> statement-breakpoint
CREATE POLICY "organization_members_select_own" ON "organization_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("organization_members"."user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid())));--> statement-breakpoint
REVOKE ALL ON TABLE "public"."organizations" FROM "anon", "authenticated";--> statement-breakpoint
GRANT SELECT, UPDATE ON TABLE "public"."organizations" TO "authenticated";--> statement-breakpoint
REVOKE ALL ON TABLE "public"."organization_members" FROM "anon", "authenticated";--> statement-breakpoint
GRANT SELECT ON TABLE "public"."organization_members" TO "authenticated";
