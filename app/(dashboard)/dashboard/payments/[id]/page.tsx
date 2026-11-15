import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { Card, outlineLinkClass } from "@/components/dashboard/shell";
import { getPayment, PAYMENT_STATUS_LABEL, requireSeller } from "@/lib/dashboard/queries";
import { METHOD_LABELS, PAID_OUT_MESSAGE } from "@/lib/payments/labels";
import { hasPayoutFor } from "@/lib/payouts/service";
import { formatRand } from "@/lib/money";

export const metadata = { title: "Payment" };

async function PaymentContent({
  params,
}: {
  params: PageProps<"/dashboard/payments/[id]">["params"];
}) {
  const { seller } = await requireSeller();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const p = await getPayment(seller.id, id.data);
  if (!p) notFound();

  const paidOut = p.status === "succeeded" && (await hasPayoutFor(p.id));
  const rows: [string, string][] = [
    ["Status", PAYMENT_STATUS_LABEL[p.status]],
    ["Customer", p.buyerName || "Not given"],
    ["Paid with", METHOD_LABELS[p.method]],
    ["Date", p.createdAt.toLocaleString("en-ZA")],
    ...(p.itemName ? ([["Item", p.itemName]] as [string, string][]) : []),
    ["Amount", formatRand(p.amountCents)],
    ["Ollo fee", formatRand(p.feeCents)],
    ["You receive", formatRand(p.amountCents - p.feeCents)],
  ];

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href="/dashboard/payments" className="text-primary font-bold">
          All payments
        </Link>
        <h1 className="text-primary mt-2 text-3xl font-bold tracking-tight">
          {formatRand(p.amountCents)}
        </h1>
      </div>
      <Card>
        <dl className="divide-border divide-y">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-3">
              <dt className="text-muted-foreground">{k}</dt>
              <dd
                className="font-semibold"
                data-testid={`payment-${k.toLowerCase().replace(/ /g, "-")}`}
              >
                {v}
              </dd>
            </div>
          ))}
        </dl>
      </Card>
      {paidOut ? (
        <p className="bg-accent rounded-2xl p-4" data-testid="paid-out-note">
          {PAID_OUT_MESSAGE}
        </p>
      ) : p.status === "succeeded" ? (
        <Link href={`/dashboard/payments/${p.id}/refund`} className={outlineLinkClass}>
          Refund this payment
        </Link>
      ) : null}
    </div>
  );
}

export default function PaymentPage(props: PageProps<"/dashboard/payments/[id]">) {
  return (
    <Suspense fallback={null}>
      <PaymentContent params={props.params} />
    </Suspense>
  );
}
