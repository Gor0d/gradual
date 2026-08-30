import { createSupabaseServerClient } from "@/lib/supabase/server";

type PrimaryEventRow = { id: string };

/**
 * MVP assumes one active event per formando. RLS (events_select_own) scopes
 * this to the caller automatically — no explicit user filter needed.
 */
export async function getPrimaryEventId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("events")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<PrimaryEventRow>();

  return data?.id ?? null;
}
