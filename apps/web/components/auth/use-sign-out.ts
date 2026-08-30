"use client";

import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Same browser-client pattern as auth-form.tsx's signIn/signUp. Returns a
 * plain handler instead of a styled component — the desktop dropdown menu
 * and the mobile sheet need different markup around the same action.
 */
export function useSignOut() {
  const router = useRouter();

  return async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };
}
