import { redirect } from "next/navigation";

import type { User } from "@gradual/shared-types";

import { ensureCurrentUser } from "@/lib/auth/ensure-user";

/** Server Component page guard — redirects to /entrar instead of throwing. */
export async function requireCurrentUser(): Promise<User> {
  try {
    return await ensureCurrentUser();
  } catch {
    redirect("/entrar");
  }
}
