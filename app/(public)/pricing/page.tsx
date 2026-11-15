import { Suspense } from "react";
import { LivePage } from "@/components/public/page-shell";
import { PricingBody } from "@/components/public/pricing-page";
import { PRICING } from "@/lib/public/pages";

export const metadata = { title: "Pricing" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LivePage title={PRICING.hero.title} subtitle={PRICING.hero.body}>
        <PricingBody />
      </LivePage>
    </Suspense>
  );
}
