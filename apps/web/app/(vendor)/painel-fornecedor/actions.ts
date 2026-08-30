"use server";

import { revalidatePath } from "next/cache";

import { ensureCurrentUser } from "@/lib/auth/ensure-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type InquiryStatus = "new" | "viewed" | "contacted" | "closed";

export type UpdateInquiryStatusState = {
  error?: string;
  success?: boolean;
};

const allowedStatuses = new Set<InquiryStatus>(["viewed", "contacted", "closed"]);

export async function updateInquiryStatus(
  _state: UpdateInquiryStatusState,
  formData: FormData,
): Promise<UpdateInquiryStatusState> {
  await ensureCurrentUser();
  const inquiryId = formData.get("inquiryId");
  const requestedStatus = formData.get("status");

  if (
    typeof inquiryId !== "string" ||
    typeof requestedStatus !== "string" ||
    !allowedStatuses.has(requestedStatus as InquiryStatus)
  ) {
    return { error: "Não foi possível identificar a atualização." };
  }

  const status = requestedStatus as InquiryStatus;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vendor_inquiries")
    .update({ status })
    .eq("id", inquiryId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error || !data) {
    return { error: "Este pedido não pôde ser atualizado." };
  }

  revalidatePath("/painel-fornecedor");
  return { success: true };
}
