import { connection } from "next/server";
import { Suspense } from "react";
import { PricingSection, PublicHeader } from "@/components/public/landing";
import { getEnv } from "@/lib/env";
import { getCopy } from "@/lib/public/copy";

export const metadata = { title: "Pricing" };

async function PricingContent() {
  // Read the flag on every request, not once at build time.
  await connection();
  const live = getEnv().PAYMENTS_LIVE;
  return (
    <div className="bg-background min-h-screen">
      <PublicHeader live={live} />
      <main>
        <PricingSection pricing={getCopy(live).pricing} />
      </main>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={null}>
      <PricingContent />
    </Suspense>
  );
}
