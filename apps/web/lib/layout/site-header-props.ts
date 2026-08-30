import { getCurrentUserOrNull } from "@/lib/auth/get-current-user-or-null";
import { getPrimaryEventId } from "@/lib/events/get-primary-event";

/** Shared by every route-group layout that renders SiteHeader, so the two never drift apart. */
export async function getSiteHeaderProps() {
  const [user, primaryEventId] = await Promise.all([getCurrentUserOrNull(), getPrimaryEventId()]);
  return {
    user: user ? { fullName: user.fullName, email: user.email } : null,
    primaryEventHref: primaryEventId ? `/eventos/${primaryEventId}` : null,
  };
}
