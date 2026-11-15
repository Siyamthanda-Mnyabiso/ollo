import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { sellerSurvey } from "@/lib/db/schema";
import { getSellerByUserId } from "@/lib/sellers/queries";
import { BusinessForm } from "@/components/onboarding/business-form";
import { StepShell } from "@/components/onboarding/ui";

export const metadata = { title: "About your business" };

async function BusinessStepContent() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const seller = await getSellerByUserId(user.id);
  if (!seller) redirect("/onboarding/profile");
  const [survey] = await db
    .select()
    .from(sellerSurvey)
    .where(eq(sellerSurvey.sellerId, seller.id))
    .limit(1);
  return (
    <StepShell
      step={2}
      title="About your business"
      subtitle="This helps us build the right payments for sellers like you."
    >
      <BusinessForm defaults={survey} />
    </StepShell>
  );
}

export default function BusinessStep() {
  return (
    <Suspense fallback={null}>
      <BusinessStepContent />
    </Suspense>
  );
}
