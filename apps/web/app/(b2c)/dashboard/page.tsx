import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/require-user";
import { getPrimaryEventId } from "@/lib/events/get-primary-event";

/** MVP has one event per formando — this is a router, not a real dashboard. */
export default async function DashboardPage() {
  await requireCurrentUser();

  const eventId = await getPrimaryEventId();
  redirect(eventId ? `/eventos/${eventId}` : "/onboarding");
}
