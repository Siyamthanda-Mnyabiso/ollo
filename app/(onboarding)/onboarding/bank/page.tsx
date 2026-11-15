import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { canOpenStep } from "@/lib/sellers/onboarding-steps";
import { getOnboardingState } from "@/lib/sellers/queries";
import { BankForm } from "@/components/onboarding/bank-form";
import { StepShell } from "@/components/onboarding/ui";

export const metadata = { title: "Bank account" };

async function BankStepContent() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const state = await getOnboardingState(user.id);
  const seller = state.seller;
  if (!seller) redirect("/onboarding/profile");
  // The bank step only opens once the ID check has passed.
  if (!canOpenStep("/onboarding/bank", state)) redirect("/onboarding/verify");
  return (
    <StepShell
      step={5}
      title="Add your bank account"
      subtitle="This is where your money will be paid."
    >
      <BankForm defaultHolder={seller.fullName} />
    </StepShell>
  );
}

export default function BankStep() {
  return (
    <Suspense fallback={null}>
      <BankStepContent />
    </Suspense>
  );
}
