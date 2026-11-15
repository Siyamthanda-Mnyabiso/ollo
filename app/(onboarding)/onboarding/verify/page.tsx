import { StepShell } from "@/components/onboarding/ui";

export const metadata = { title: "Verify your identity" };

/** Placeholder until the ID and bank steps are built. */
export default function VerifyStep() {
  return (
    <StepShell
      step={4}
      title="Verify your identity"
      subtitle="ID number and selfie check. This step is built next."
    >
      <p className="text-muted-foreground">
        Your shop details are saved. You can close this page and come back.
      </p>
    </StepShell>
  );
}
