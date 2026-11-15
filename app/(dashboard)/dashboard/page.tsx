import Link from "next/link";
import { Suspense } from "react";
import { Card, ctaLinkClass } from "@/components/dashboard/shell";
import {
  getMoneyIn,
  getRecentPayments,
  parseRange,
  RANGES,
  requireSeller,
  type RangeKey,
} from "@/lib/dashboard/queries";
import { METHOD_LABELS } from "@/lib/payments/labels";
import { formatRand } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata = { title: "Home" };

const STATUS_LABEL = {
  pending: "Waiting",
  succeeded: "Paid",
  failed: "Failed",
  expired: "Expired",
  refunded: "Refunded",
} as const;

async function HomeContent({
  searchParams,
}: {
  searchParams: PageProps<"/dashboard">["searchParams"];
}) {
  const { seller } = await requireSeller();
  const sp = await searchParams;
  const range: RangeKey = parseRange(typeof sp.range === "string" ? sp.range : undefined);
  const [money, recent] = await Promise.all([
    getMoneyIn(seller.id, range),
    getRecentPayments(seller.id),
  ]);
  const netCents = money.grossCents - money.feeCents;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-primary text-3xl font-bold tracking-tight">
          Hi {seller.fullName.split(" ")[0]}
        </h1>
        <Link href="/dashboard/requests/new" className={ctaLinkClass}>
          Request payment
        </Link>
      </div>

      <div role="tablist" aria-label="Period" className="flex gap-1">
        {(Object.keys(RANGES) as RangeKey[]).map((key) => (
          <Link
            key={key}
            role="tab"
            aria-selected={key === range}
            href={`/dashboard?range=${key}`}
            className={cn(
              "rounded-lg px-3 py-2 text-base font-semibold",
              key === range ? "bg-accent text-primary" : "text-muted-foreground hover:bg-accent",
            )}
          >
            {RANGES[key].label}
          </Link>
        ))}
      </div>

      <section
        aria-label="Money in"
        className="rounded-2xl bg-[var(--ollo-teal-900)] p-6 text-white"
      >
        <p className="text-sm opacity-80">Money in, {RANGES[range].label.toLowerCase()}</p>
        <p className="mt-1 text-4xl font-extrabold" data-testid="money-in">
          {formatRand(money.grossCents)}
        </p>
        <p className="mt-2 text-sm opacity-80">
          {money.count} {money.count === 1 ? "payment" : "payments"}. After Ollo fees you keep{" "}
          {formatRand(netCents)}.
        </p>
      </section>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Recent payments</h2>
          <Link href="/dashboard/payments" className="text-primary font-bold">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-muted-foreground mt-3">
            No payments yet. Send a payment request, or share your pay link.
          </p>
        ) : (
          <ul className="divide-border mt-2 divide-y">
            {recent.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="font-semibold">{p.buyerName || "Customer"}</p>
                  <p className="text-muted-foreground text-sm">
                    {METHOD_LABELS[p.method]} on {p.createdAt.toLocaleDateString("en-ZA")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatRand(p.amountCents)}</p>
                  <p className="text-muted-foreground text-sm">{STATUS_LABEL[p.status]}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-bold">Your pay link</h2>
        <p className="text-primary mt-1 text-lg font-bold break-all">
          {new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").host}/{seller.handle}
        </p>
      </Card>
    </div>
  );
}

export default function DashboardHome(props: PageProps<"/dashboard">) {
  return (
    <Suspense fallback={null}>
      <HomeContent searchParams={props.searchParams} />
    </Suspense>
  );
}
