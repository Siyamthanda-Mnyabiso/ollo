import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { getOnboardingState } from "@/lib/sellers/queries";
import { canOpenStep } from "@/lib/sellers/onboarding-steps";
import { getVerificationProvider, IDENTITY_FAILURE_MESSAGES } from "@/lib/verification";
import { IdentityForm } from "@/components/onboarding/identity-form";
import { IdentityStatus } from "@/components/onboarding/identity-status";
import { StepShell } from "@/components/onboarding/ui";

export const metadata = { title: "Verify your identity" };

async function VerifyStepContent() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const state = await getOnboardingState(user.id);
  if (!canOpenStep("/onboarding/verify", state)) redirect("/onboarding");
  const verification = state.verification;
  const status = verification?.idStatus ?? "not_started";

  let body;
  if (status === "checking" || status === "verified") {
    body = <IdentityStatus initial={status} />;
  } else if (status === "failed") {
    // The reason is not stored, so ask the provider again for the saved check.
    let message: string | undefined;
    try {
      const result = verification?.idCheckReference
        ? await getVerificationProvider().getIdentityCheck(verification.idCheckReference)
        : null;
      if (result?.status === "failed") message = IDENTITY_FAILURE_MESSAGES[result.reason];
    } catch {
      message = IDENTITY_FAILURE_MESSAGES.unavailable;
    }
    body = <IdentityStatus initial="failed" failureMessage={message} />;
  } else {
    body = <IdentityForm />;
  }

  return (
    <StepShell
      step={4}
      title="Verify your identity"
      subtitle="We check your ID so we can pay you safely."
    >
      {body}
    </StepShell>
  );
}

export default function VerifyStep() {
  return (
    <Suspense fallback={null}>
      <VerifyStepContent />
    </Suspense>
  );
}
