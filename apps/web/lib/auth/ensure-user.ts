import type { User } from "@gradual/shared-types";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toUser, type UserRow } from "@/lib/supabase/rows";

/**
 * Fetches the caller's `public.users` row, creating it on first call. Safe
 * to call from any authenticated Server Action or Server Component — RLS
 * (`users_select_own`/`users_insert_own`, both scoped to
 * `auth_user_id = auth.uid()`) means this can only ever touch the caller's
 * own row, never anyone else's.
 */
export async function ensureCurrentUser(): Promise<User> {
  const supabase = await createSupabaseServerClient();

  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claims) {
    throw new Error("Not authenticated");
  }

  const authUserId = claims.claims.sub;
  const email = claims.claims.email;
  if (!email) {
    throw new Error("Authenticated user has no email");
  }

  const { data: existing, error: selectError } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle<UserRow>();

  if (selectError) {
    throw selectError;
  }
  if (existing) {
    return toUser(existing);
  }

  const { data: created, error: insertError } = await supabase
    .from("users")
    .insert({ auth_user_id: authUserId, email })
    .select("*")
    .single<UserRow>();

  if (insertError) {
    throw insertError;
  }

  return toUser(created);
}
