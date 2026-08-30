import type { User } from "@gradual/shared-types";

import { ensureCurrentUser } from "@/lib/auth/ensure-user";

/** For pages/components that work for both signed-in and anonymous visitors. */
export async function getCurrentUserOrNull(): Promise<User | null> {
  try {
    return await ensureCurrentUser();
  } catch {
    return null;
  }
}
