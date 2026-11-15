import Link from "next/link";
import { Suspense } from "react";
import { Card } from "@/components/dashboard/shell";
import { requireSeller } from "@/lib/dashboard/queries";
import { formatRand } from "@/lib/money";
import { isPaused } from "@/lib/payouts/config";
import { getBankSummary, listPayouts } from "@/lib/payouts/service";
import { sellerOwedCents } from "@/lib/payments/service";
import { db } from "@/lib/db";

export const metadata = { title: "Payouts" };

const STATUS = {
  pending: "Sending",
  processing: "On its way",
  paid: "Paid",
  failed: "Failed",
} as const;

async function PayoutsContent() {
  const { seller } = await requireSeller();
  const [owed, bank, rows] = await Promise.all([
    sellerOwedCents(db, seller.id),
    getBankSummary(seller.id),
    listPayouts(seller.id),
  ]);
  const paused = isPaused(seller.payoutsPausedUntil);

  return (
    <div className="space-y-6">
      <h1 className="text-primary text-3xl font-bold tracking-tight">Payouts</h1>

      {paused && seller.payoutsPausedUntil ? (
        <div role="status" className="bg-accent rounded-2xl p-5" data-testid="payout-pause">
          <p className="font-bold">Payouts are paused</p>
          <p className="mt-1">
            You changed your bank account, so we hold payouts until{" "}
            {seller.payoutsPausedUntil.toLocaleString("en-ZA")}. This protects you if someone else
            made the change. Your money is safe in your Ollo balance and will be paid out
            afterwards.
          </p>
        </div>
      ) : null}

      <Card>
        <p className="text-muted-foreground text-sm">Waiting to be paid out</p>
        <p className="mt-1 text-3xl font-extrabold" data-testid="owed">
          {formatRand(owed)}
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          Bank payments are paid out to your account straight away. Card payments are not paid out
          instantly.
        </p>
      </Card>

      <Card>
        <h2 className="text-lg font-bold">Your bank account</h2>
        {bank ? (
          <p className="mt-1">
            {bank.bankName}, account ending {bank.last4}
          </p>
        ) : (
          <p className="text-muted-foreground mt-1">No verified bank account.</p>
        )}
        <Link href="/dashboard/settings" className="text-primary mt-2 inline-block font-bold">
          Change bank account
        </Link>
      </Card>

      <Card>
        <h2 className="text-lg font-bold">Payout history</h2>
        {rows.length === 0 ? (
          <p className="text-muted-foreground mt-2">No payouts yet.</p>
        ) : (
          <ul className="divide-border mt-2 divide-y">
            {rows.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                <span className="text-muted-foreground text-sm">
                  {p.createdAt.toLocaleString("en-ZA")}
                </span>
                <span className="text-right">
                  <span className="block font-bold">{formatRand(p.amountCents)}</span>
                  <span className="text-muted-foreground block text-sm">{STATUS[p.status]}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export default function PayoutsPage() {
  return (
    <Suspense fallback={null}>
      <PayoutsContent />
    </Suspense>
  );
}
