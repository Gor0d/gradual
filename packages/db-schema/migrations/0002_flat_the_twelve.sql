CREATE TYPE "public"."vendor_inquiry_contact_preference" AS ENUM('email', 'phone', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."vendor_inquiry_status" AS ENUM('new', 'viewed', 'contacted', 'closed');--> statement-breakpoint
CREATE TABLE "vendor_inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"requester_user_id" uuid NOT NULL,
	"event_id" uuid,
	"message" text NOT NULL,
	"contact_name" text NOT NULL,
	"contact_email" text,
	"contact_phone" text,
	"contact_preference" "vendor_inquiry_contact_preference" NOT NULL,
	"status" "vendor_inquiry_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_inquiries_message_length" CHECK (char_length(trim("vendor_inquiries"."message")) between 1 and 2000),
	CONSTRAINT "vendor_inquiries_contact_name_length" CHECK (char_length(trim("vendor_inquiries"."contact_name")) between 1 and 120),
	CONSTRAINT "vendor_inquiries_contact_email_length" CHECK ("vendor_inquiries"."contact_email" is null or char_length(trim("vendor_inquiries"."contact_email")) between 1 and 254),
	CONSTRAINT "vendor_inquiries_contact_phone_length" CHECK ("vendor_inquiries"."contact_phone" is null or char_length(trim("vendor_inquiries"."contact_phone")) between 8 and 32),
	CONSTRAINT "vendor_inquiries_contact_reachable" CHECK ("vendor_inquiries"."contact_email" is not null or "vendor_inquiries"."contact_phone" is not null),
	CONSTRAINT "vendor_inquiries_contact_preference_matches" CHECK (("vendor_inquiries"."contact_preference" = 'email' and "vendor_inquiries"."contact_email" is not null)
        or ("vendor_inquiries"."contact_preference" in ('phone', 'whatsapp') and "vendor_inquiries"."contact_phone" is not null))
);
--> statement-breakpoint
ALTER TABLE "vendor_inquiries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vendor_inquiries" ADD CONSTRAINT "vendor_inquiries_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_inquiries" ADD CONSTRAINT "vendor_inquiries_requester_user_id_users_id_fk" FOREIGN KEY ("requester_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_inquiries" ADD CONSTRAINT "vendor_inquiries_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vendor_inquiries_vendor_id_created_at_idx" ON "vendor_inquiries" USING btree ("vendor_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "vendor_inquiries_requester_user_id_created_at_idx" ON "vendor_inquiries" USING btree ("requester_user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "vendor_inquiries_event_id_idx" ON "vendor_inquiries" USING btree ("event_id") WHERE "vendor_inquiries"."event_id" is not null;--> statement-breakpoint
CREATE POLICY "vendor_inquiries_select_own_or_vendor_owner" ON "vendor_inquiries" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("vendor_inquiries"."requester_user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid())) or exists (
        select 1 from "vendors" where "vendors"."id" = "vendor_inquiries"."vendor_id" and "vendors"."owner_user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid()))
      ));--> statement-breakpoint
CREATE POLICY "vendor_inquiries_insert_own" ON "vendor_inquiries" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("vendor_inquiries"."requester_user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid()))
        and "vendor_inquiries"."status" = 'new'
        and (
          "vendor_inquiries"."event_id" is null or exists (select 1 from "events" where "events"."id" = "vendor_inquiries"."event_id" and "events"."user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid())))
        )
        and exists (
          select 1 from "vendor_moderation" where "vendor_moderation"."vendor_id" = "vendor_inquiries"."vendor_id" and "vendor_moderation"."status" = 'aprovado'
        ));--> statement-breakpoint
CREATE POLICY "vendor_inquiries_update_status_by_vendor_owner" ON "vendor_inquiries" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (select 1 from "vendors" where "vendors"."id" = "vendor_inquiries"."vendor_id" and "vendors"."owner_user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid())))) WITH CHECK (exists (select 1 from "vendors" where "vendors"."id" = "vendor_inquiries"."vendor_id" and "vendors"."owner_user_id" = (select "users"."id" from "users" where "users"."auth_user_id" = (select auth.uid()))));--> statement-breakpoint
REVOKE ALL ON TABLE "public"."vendor_inquiries" FROM "anon", "authenticated";--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "public"."vendor_inquiries" TO "authenticated";--> statement-breakpoint
GRANT UPDATE ("status") ON TABLE "public"."vendor_inquiries" TO "authenticated";