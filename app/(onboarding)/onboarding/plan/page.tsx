import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { getOnboardingState } from "@/lib/sellers/queries";
import { PlanForm } from "@/components/onboarding/plan-form";
import { StepShell } from "@/components/onboarding/ui";

export const metadata = { title: "Choose a plan" };

async function PlanStepContent() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const state = await getOnboardingState(user.id);
  if (!state.seller) redirect("/onboarding/profile");
  if (state.verification?.bankStatus !== "verified") redirect("/onboarding/bank");
  return (
    <StepShell
      step={6}
      title="Choose your plan"
      subtitle="You can change this any time in billing."
    >
      <PlanForm />
    </StepShell>
  );
}

export default function PlanStep() {
  return (
    <Suspense fallback={null}>
      <PlanStepContent />
    </Suspense>
  );
}
