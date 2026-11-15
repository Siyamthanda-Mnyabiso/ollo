import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { getEnv } from "@/lib/env";
import { getSellerByUserId } from "@/lib/sellers/queries";
import { CtaButton, Wordmark } from "@/components/onboarding/ui";

export const metadata = { title: "You are all set" };

async function DoneContent() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const seller = await getSellerByUserId(user.id);
  if (!seller?.onboardedAt) redirect("/onboarding");
  const domain = new URL(getEnv().NEXT_PUBLIC_APP_URL).host;
  const link = `${domain}/${seller.handle}`;
  const firstName = seller.fullName.split(" ")[0];
  return (
    <main className="bg-background flex min-h-screen flex-col">
      <header className="flex h-20 items-center px-6 md:px-10">
        <Wordmark />
      </header>
      <div className="flex flex-1 items-start justify-center px-4 pb-16 md:items-center">
        <div className="bg-card w-full max-w-[560px] rounded-3xl p-6 shadow-sm md:p-8">
          <h1 className="text-primary text-3xl font-bold tracking-tight">
            You are all set, {firstName}
          </h1>
          <p className="text-muted-foreground mt-2 text-base">Your pay link is ready to share.</p>
          <div className="bg-accent mt-6 rounded-2xl p-4">
            <p className="text-sm font-bold">Your pay link</p>
            <p className="text-primary mt-1 text-lg font-bold break-all">{link}</p>
          </div>
          <div className="mt-6">
            <Link href="/dashboard">
              <CtaButton className="w-full">Go to dashboard</CtaButton>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function DonePage() {
  return (
    <Suspense fallback={null}>
      <DoneContent />
    </Suspense>
  );
}
