import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/server";
import { getSellerByUserId } from "@/lib/sellers/queries";
import { ProfileForm } from "@/components/onboarding/profile-form";
import { StepShell } from "@/components/onboarding/ui";

export const metadata = { title: "About you" };

async function ProfileStepContent() {
  const user = await getCurrentUser();
  const seller = user ? await getSellerByUserId(user.id) : null;
  return (
    <StepShell
      step={1}
      title="Tell us about you"
      subtitle="This is how customers will see your pay page."
    >
      <ProfileForm defaults={seller ?? undefined} />
    </StepShell>
  );
}

export default function ProfileStep() {
  return (
    <Suspense fallback={null}>
      <ProfileStepContent />
    </Suspense>
  );
}
