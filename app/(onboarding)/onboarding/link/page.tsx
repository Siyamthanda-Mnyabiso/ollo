import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { getEnv } from "@/lib/env";
import { getSellerByUserId } from "@/lib/sellers/queries";
import { LinkForm } from "@/components/onboarding/link-form";
import { StepShell } from "@/components/onboarding/ui";

export const metadata = { title: "Your pay link" };

async function LinkStepContent() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const seller = await getSellerByUserId(user.id);
  if (!seller) redirect("/onboarding/profile");
  const domain = new URL(getEnv().NEXT_PUBLIC_APP_URL).host;
  return (
    <StepShell
      step={3}
      title="Choose your pay link"
      subtitle="This is the link you share with customers. You can change it later in settings."
    >
      <LinkForm initialHandle={seller.handle} domain={domain} />
    </StepShell>
  );
}

export default function LinkStep() {
  return (
    <Suspense fallback={null}>
      <LinkStepContent />
    </Suspense>
  );
}
