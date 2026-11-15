import Link from "next/link";
import { Check } from "lucide-react";
import { PrimaryLink } from "@/components/public/page-shell";
import { PRICING } from "@/lib/public/pages";

export function PricingBody() {
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {PRICING.plans.map((plan, i) => (
          <div
            key={plan.name}
            className={`flex flex-col gap-6 rounded-[32px] p-8 md:p-10 ${i === 0 ? "bg-white" : "bg-[var(--ollo-teal-900)] text-white"}`}
          >
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold">{plan.name}</h2>
              <p className="text-[40px] leading-[48px] font-bold">{plan.price}</p>
            </div>
            <ul className="flex flex-1 flex-col gap-3">
              {plan.lines.map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <Check className="mt-0.5 size-5 shrink-0 text-[#00c781]" aria-hidden="true" />
                  {line}
                </li>
              ))}
            </ul>
            {i === 0 ? (
              <PrimaryLink href="/sign-in">{plan.button}</PrimaryLink>
            ) : (
              <Link
                href="/sign-in"
                className="inline-flex h-14 items-center justify-center rounded-full bg-[#00c781] px-8 font-bold whitespace-nowrap text-[var(--ollo-teal-900)]"
              >
                {plan.button}
              </Link>
            )}
          </div>
        ))}
      </div>
      <section className="flex flex-col gap-6">
        <h2 className="text-[40px] leading-[48px] font-bold">{PRICING.table.title}</h2>
        <dl className="flex flex-col divide-y divide-[#d5dde3] rounded-[32px] bg-white px-8 py-4">
          {PRICING.table.rows.map(([name, value]) => (
            <div key={name} className="flex flex-col gap-1 py-4 md:flex-row md:justify-between">
              <dt className="font-bold">{name}</dt>
              <dd className="text-[var(--ollo-ink-500)]">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
