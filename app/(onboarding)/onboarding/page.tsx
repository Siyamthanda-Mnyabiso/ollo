import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { nextOnboardingPath } from "@/lib/sellers/onboarding-steps";
import { getOnboardingState } from "@/lib/sellers/queries";

/** Sends the seller to the first step they have not finished. */
async function OnboardingIndexContent() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const state = await getOnboardingState(user.id);
  return redirect(nextOnboardingPath(state));
}

export default function OnboardingIndex() {
  return (
    <Suspense fallback={null}>
      <OnboardingIndexContent />
    </Suspense>
  );
}
