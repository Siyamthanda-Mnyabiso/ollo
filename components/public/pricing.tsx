import Link from "next/link";
import { Wordmark } from "@/components/onboarding/ui";
import type { PricingCopy } from "@/lib/public/copy";

export function PublicHeader({ live }: { live: boolean }) {
  return (
    <header className="mx-auto flex h-20 w-full max-w-5xl items-center justify-between px-4 md:px-8">
      <Link href="/">
        <Wordmark />
      </Link>
      <nav aria-label="Main" className="flex items-center gap-4">
        <Link href="/pricing" className="text-foreground text-base font-semibold">
          Pricing
        </Link>
        {live ? (
          <Link href="/sign-in" className="text-primary text-base font-bold">
            Sign in
          </Link>
        ) : null}
      </nav>
    </header>
  );
}

export function PricingSection({ pricing }: { pricing: PricingCopy }) {
  return (
    <section
      aria-labelledby="pricing-title"
      className="mx-auto w-full max-w-5xl px-4 py-12 md:px-8"
    >
      <h2 id="pricing-title" className="text-primary text-3xl font-bold tracking-tight">
        {pricing.title}
      </h2>
      <p className="text-muted-foreground mt-2">{pricing.intro}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {pricing.plans.map((plan) => (
          <div key={plan.name} className="bg-card rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <p className="text-primary mt-1 text-lg font-bold">{plan.price}</p>
            <ul className="mt-3 space-y-1">
              {plan.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground mt-4 text-sm">{pricing.minimumFee}</p>
    </section>
  );
}
