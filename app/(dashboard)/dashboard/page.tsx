import Link from "next/link";
import { Suspense } from "react";
import { PlusIcon, TrendIcon } from "@/components/dashboard/icons";
import { HomeShare } from "@/components/dashboard/home-share";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  getMoneyBetween,
  getMoneyIn,
  getPendingCount,
  getRecentPayments,
  parseRange,
  previousPeriod,
  RANGES,
  requireSeller,
  type RangeKey,
} from "@/lib/dashboard/queries";
import { formatRandCompact, formatRandFigma } from "@/lib/money";
import { sellerOwedCents } from "@/lib/payments/service";
import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";

export const metadata = { title: "Home" };

const CARD = "flex flex-col gap-2 rounded-2xl bg-white p-6";

/** Good morning, afternoon or evening, by the time in South Africa. */
function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-ZA", {
      hour: "numeric",
      hour12: false,
      timeZone: "Africa/Johannesburg",
    }).format(new Date()),
  );
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

async function HomeContent({
  searchParams,
}: {
  searchParams: PageProps<"/dashboard">["searchParams"];
}) {
  const { seller } = await requireSeller();
  const sp = await searchParams;
  const range: RangeKey = parseRange(typeof sp.range === "string" ? sp.range : undefined);
  const before = previousPeriod(range);
  const [money, previous, pending, owed, recent] = await Promise.all([
    getMoneyIn(seller.id, range),
    getMoneyBetween(seller.id, before.from, before.to),
    getPendingCount(seller.id, range),
    sellerOwedCents(db, seller.id),
    getRecentPayments(seller.id, 3),
  ]);
  // Shown only when it is a real rise on the period before.
  const rise =
    previous > 0 && money.grossCents > previous
      ? Math.round(((money.grossCents - previous) / previous) * 100)
      : 0;
  const link = `${getEnv().NEXT_PUBLIC_APP_URL}/${seller.handle}`;
  const shownLink = link.replace(/^https?:\/\//, "");
  const todayLabel = range === "today" ? "today" : `in ${RANGES[range].label}`;

  return (
    <>
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-4">
        <h1 className="flex-1 text-2xl leading-8 font-bold tracking-[-0.005em] md:text-[32px] md:leading-10">
          {greeting()}, {seller.fullName.split(" ")[0]}
        </h1>
        <Link
          href="/dashboard/items"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--ollo-mint-500)] px-6 text-base font-bold text-[var(--ollo-teal-900)]"
        >
          <PlusIcon size={24} />
          Add item
        </Link>
      </div>

      <div role="tablist" aria-label="Period" className="flex gap-6 border-b border-[#d5dde3]">
        {(Object.keys(RANGES) as RangeKey[]).map((key) => (
          <Link
            key={key}
            role="tab"
            aria-selected={key === range}
            href={`/dashboard?range=${key}`}
            className={`flex h-12 items-center border-b-[3px] text-base leading-6 font-bold ${
              key === range
                ? "border-[var(--ollo-mint-500)] text-black"
                : "border-transparent text-[var(--ollo-ink-500)]"
            }`}
          >
            {RANGES[key].label}
          </Link>
        ))}
      </div>

      <section
        aria-label="Payments today"
        className="flex flex-col gap-2 rounded-2xl bg-[var(--ollo-teal-900)] p-6"
      >
        <p className="text-base leading-6 text-[#d3f6e7]">Payments {todayLabel}</p>
        <p className="text-[40px] leading-[48px] font-bold text-white" data-testid="money-in">
          {formatRandFigma(money.grossCents)}
        </p>
        {rise > 0 ? (
          <p className="flex items-center gap-2 text-base leading-6 font-bold text-[var(--ollo-mint-500)]">
            <TrendIcon size={24} />
            Up {rise}% on {before.label}
          </p>
        ) : null}
      </section>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className={`${CARD} md:flex-1`}>
          <p className="text-base leading-6 text-[var(--ollo-ink-500)]">Payouts</p>
          <p className="text-2xl leading-8 font-bold">{formatRandFigma(owed)}</p>
          <p className="text-base leading-6 font-bold text-[#007a4d]">
            Straight to your bank account
          </p>
        </div>
        <div className={`${CARD} md:flex-1`}>
          <p className="text-base leading-6 text-[var(--ollo-ink-500)]">Payments</p>
          <p className="text-2xl leading-8 font-bold" data-testid="payments-count">
            {money.count}
          </p>
          <p className="text-base leading-6 font-bold text-[#007a4d]">{pending} pending</p>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <section className="flex flex-col rounded-2xl bg-white p-6 lg:flex-1">
          <div className="flex items-center gap-2">
            <h2 className="flex-1 text-xl leading-7 font-bold">Recent payments</h2>
            <Link
              href="/dashboard/payments"
              className="inline-flex h-12 items-center justify-center px-6 text-base font-bold text-[var(--ollo-teal-700)]"
            >
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="py-4 text-base text-[var(--ollo-ink-500)]">
              No payments yet. Send a payment request, or share your pay link.
            </p>
          ) : (
            <ul>
              {recent.map((p, i) => (
                <li
                  key={p.id}
                  className={`flex items-center gap-4 py-4 ${i < recent.length - 1 ? "border-b border-[#d5dde3]" : ""}`}
                >
                  <Link
                    href={`/dashboard/payments/${p.id}`}
                    className="flex min-w-0 flex-1 flex-col gap-1"
                  >
                    <span className="truncate text-base leading-6 font-bold">
                      {p.buyerName || "Customer"}
                    </span>
                    <span className="truncate text-base leading-6 text-[var(--ollo-ink-500)]">
                      Payment #{p.id.slice(0, 6).toUpperCase()}
                    </span>
                  </Link>
                  <span className="flex items-center gap-2">
                    <span className="text-base leading-6 font-bold">
                      {formatRandCompact(p.amountCents)}
                    </span>
                    <StatusBadge status={p.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 lg:flex-1">
          <h2 className="text-xl leading-7 font-bold">Share your pay link</h2>
          <p className="text-base leading-6 text-[var(--ollo-ink-500)]">
            Send your link to customers and add it to your Instagram bio.
          </p>
          <HomeShare link={link} shownLink={shownLink} displayName={seller.displayName} />
        </section>
      </div>
    </>
  );
}

export default function DashboardHome(props: PageProps<"/dashboard">) {
  return (
    <Suspense fallback={null}>
      <HomeContent searchParams={props.searchParams} />
    </Suspense>
  );
}
