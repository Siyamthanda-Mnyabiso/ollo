import Link from "next/link";
import { CtaButton, StepShell } from "@/components/onboarding/ui";

export const metadata = { title: "Verify your identity" };

/**
 * Placeholder. The ID number and selfie check is not built yet because it needs an ID
 * verification provider. Until then the flow continues to the bank account step.
 */
export default function VerifyStep() {
  return (
    <StepShell
      step={4}
      title="Verify your identity"
      subtitle="We check your ID so we can pay you safely."
    >
      <p className="text-muted-foreground mb-6">
        The ID and selfie check is not switched on yet. Continue to add your bank account.
      </p>
      <Link href="/onboarding/bank">
        <CtaButton>Continue</CtaButton>
      </Link>
    </StepShell>
  );
}
