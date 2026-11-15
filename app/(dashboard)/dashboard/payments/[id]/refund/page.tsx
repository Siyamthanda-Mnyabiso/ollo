import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { Card } from "@/components/dashboard/shell";
import { RefundForm } from "@/components/dashboard/refund-form";
import { getPayment, requireSeller } from "@/lib/dashboard/queries";
import { formatRand } from "@/lib/money";
import { hasPayoutFor } from "@/lib/payouts/service";

export const metadata = { title: "Refund payment" };

async function RefundContent({
  params,
}: {
  params: PageProps<"/dashboard/payments/[id]/refund">["params"];
}) {
  const { seller } = await requireSeller();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const p = await getPayment(seller.id, id.data);
  if (!p) notFound();
  if (p.status !== "succeeded" || (await hasPayoutFor(p.id)))
    redirect(`/dashboard/payments/${p.id}`);
  const amount = formatRand(p.amountCents);
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-primary text-3xl font-bold tracking-tight">Refund {amount}</h1>
      <Card className="space-y-4">
        <p>
          {p.buyerName || "Your customer"} gets all {amount} back. You give back the{" "}
          {formatRand(p.amountCents - p.feeCents)} you received, and Ollo gives back its{" "}
          {formatRand(p.feeCents)} fee.
        </p>
        <p className="text-muted-foreground">A refund cannot be undone.</p>
        <RefundForm id={p.id} amountLabel={amount} />
      </Card>
    </div>
  );
}

export default function RefundPage(props: PageProps<"/dashboard/payments/[id]/refund">) {
  return (
    <Suspense fallback={null}>
      <RefundContent params={props.params} />
    </Suspense>
  );
}
