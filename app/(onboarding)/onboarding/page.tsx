import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { getOnboardingState } from "@/lib/sellers/queries";

/** Sends the seller to the first step they have not finished. */
async function OnboardingIndexContent() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const state = await getOnboardingState(user.id);
  if (!state.seller) redirect("/onboarding/profile");
  if (!state.hasSurvey) redirect("/onboarding/business");
  if (!state.verification) redirect("/onboarding/link");
  if (state.seller.onboardedAt) redirect("/dashboard");
  if (state.verification.bankStatus === "verified") redirect("/onboarding/plan");
  return redirect("/onboarding/verify");
}

export default function OnboardingIndex() {
  return (
    <Suspense fallback={null}>
      <OnboardingIndexContent />
    </Suspense>
  );
}
