import Link from "next/link";
import { Wordmark } from "@/components/onboarding/ui";
import { WaitlistForm } from "@/components/public/waitlist-form";
import { ctaLinkClass } from "@/components/dashboard/shell";
import { getCopy, type PublicCopy } from "@/lib/public/copy";

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

export function PricingSection({ pricing }: { pricing: PublicCopy["pricing"] }) {
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

/** The landing page. `live` comes from the PAYMENTS_LIVE flag. */
export function Landing({ live }: { live: boolean }) {
  const copy = getCopy(live);
  return (
    <div className="bg-background min-h-screen">
      <PublicHeader live={live} />
      <main>
        <section className="mx-auto w-full max-w-5xl px-4 py-12 md:px-8 md:py-20">
          <h1 className="text-primary max-w-2xl text-5xl font-extrabold tracking-tight">
            {copy.hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg">{copy.hero.body}</p>
          {live ? (
            <Link href="/sign-in" className={`${ctaLinkClass} mt-8`}>
              Make your pay link
            </Link>
          ) : (
            <div className="mt-8">
              <WaitlistForm />
            </div>
          )}
        </section>

        <section aria-label="How it works" className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
          <ol className="grid gap-4 md:grid-cols-3">
            {copy.steps.map((step, i) => (
              <li key={step.title} className="bg-card rounded-2xl p-6 shadow-sm">
                <p className="text-primary text-sm font-bold">Step {i + 1}</p>
                <h2 className="mt-1 text-xl font-bold">{step.title}</h2>
                <p className="text-muted-foreground mt-2">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-8 md:grid-cols-2 md:px-8">
          {[copy.methods, copy.payouts].map((block) => (
            <div key={block.title} className="bg-card rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold">{block.title}</h2>
              <p className="text-muted-foreground mt-2">{block.body}</p>
            </div>
          ))}
        </section>

        <PricingSection pricing={copy.pricing} />

        <section
          aria-labelledby="faq-title"
          className="mx-auto w-full max-w-5xl px-4 py-12 md:px-8"
        >
          <h2 id="faq-title" className="text-primary text-3xl font-bold tracking-tight">
            Questions
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {copy.faq.map((item) => (
              <div key={item.question} className="bg-card rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold">{item.question}</h3>
                <p className="text-muted-foreground mt-2">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 pb-20 md:px-8">
          <div className="rounded-3xl bg-[var(--ollo-teal-900)] p-8 text-white">
            <h2 className="text-3xl font-bold">{copy.cta.title}</h2>
            <p className="mt-2 max-w-xl opacity-90">{copy.cta.body}</p>
            {live ? (
              <Link href="/sign-in" className={`${ctaLinkClass} mt-6`}>
                Make your pay link
              </Link>
            ) : null}
          </div>
        </section>
      </main>
      <footer className="mx-auto flex w-full max-w-5xl items-center gap-4 px-4 py-8 md:px-8">
        <Wordmark className="text-xl" />
        <p className="text-muted-foreground">Made in South Africa. 2026 Ollo</p>
      </footer>
    </div>
  );
}
