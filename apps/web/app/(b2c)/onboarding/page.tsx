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
    <div className="flex h-full items-center justify-center">
      <OnboardingForm />
    </div>
  );
}
