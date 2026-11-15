import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { getSellerByUserId } from "@/lib/sellers/queries";
import { BankForm } from "@/components/onboarding/bank-form";
import { StepShell } from "@/components/onboarding/ui";

export const metadata = { title: "Bank account" };

async function BankStepContent() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const seller = await getSellerByUserId(user.id);
  if (!seller) redirect("/onboarding/profile");
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
