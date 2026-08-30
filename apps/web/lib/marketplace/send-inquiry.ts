"use server";

import { ensureCurrentUser } from "@/lib/auth/ensure-user";
import { getPrimaryEventId } from "@/lib/events/get-primary-event";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ContactPreference = "email" | "phone" | "whatsapp";

export type SendVendorInquiryInput = {
  vendorId: string;
  contactName: string;
  contactPreference: ContactPreference;
  contactEmail?: string;
  contactPhone?: string;
  message: string;
};

/**
 * Inserts through the Supabase client, never Drizzle — this is a
 * user-scoped mutation, so vendor_inquiries_insert_own RLS (requester_user_id
 * = caller, status pinned to 'new', vendor must be aprovado, event — when
 * given — must belong to the caller) is what actually enforces this can
 * only ever create the caller's own inquiry against an approved vendor
 * (docs/CONVENTIONS.md, "Acesso a dados").
 */
export async function sendVendorInquiry(input: SendVendorInquiryInput): Promise<void> {
  const user = await ensureCurrentUser();
  const supabase = await createSupabaseServerClient();
  const eventId = await getPrimaryEventId();

  const { error } = await supabase.from("vendor_inquiries").insert({
    vendor_id: input.vendorId,
    requester_user_id: user.id,
    event_id: eventId,
    message: input.message,
    contact_name: input.contactName,
    contact_email: input.contactEmail || null,
    contact_phone: input.contactPhone || null,
    contact_preference: input.contactPreference,
    status: "new",
  });

  if (error) {
    throw error;
  }
}
