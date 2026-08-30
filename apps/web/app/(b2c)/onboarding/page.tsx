import { redirect } from "next/navigation";

import { OnboardingForm } from "@/components/checklist/onboarding-form";
import { requireCurrentUser } from "@/lib/auth/require-user";
import { getPrimaryEventId } from "@/lib/events/get-primary-event";

export default async function OnboardingPage() {
  await requireCurrentUser();

  const eventId = await getPrimaryEventId();
  if (eventId) {
    redirect(`/eventos/${eventId}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
      <OnboardingForm />
    </main>
  );
}
