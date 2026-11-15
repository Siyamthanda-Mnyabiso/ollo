import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PayShell } from "@/components/pay/page-shell";
import { formatRand } from "@/lib/money";
import { refreshPayment } from "@/lib/payments/service";

export const metadata = { title: "Payment status" };

async function DoneContent({
  params,
  searchParams,
}: {
  params: PageProps<"/[handle]/done">["params"];
  searchParams: PageProps<"/[handle]/done">["searchParams"];
}) {
  const { handle } = await params;
  const sp = await searchParams;
  const id = z.uuid().safeParse(typeof sp.p === "string" ? sp.p : "");
  if (!id.success) notFound();
  const payment = await refreshPayment(id.data);
  if (!payment) notFound();
  const amount = formatRand(payment.amountCents);

  if (payment.status === "succeeded") {
    return (
      <PayShell
        title="Payment received"
        subtitle={`Your payment of ${amount} went through. Thank you.`}
      >
        <p className="text-muted-foreground">You can close this page.</p>
      </PayShell>
    );
  }
  if (payment.status === "pending") {
    return (
      <PayShell
        title="Waiting for your bank"
        subtitle={`Your payment of ${amount} has not been confirmed yet.`}
      >
        <p className="text-muted-foreground">
          This can take a minute. Refresh this page to check again. If money left your account, it
          is safe and will be matched to this payment.
        </p>
      </PayShell>
    );
  }
  return (
    <PayShell
      title={payment.status === "expired" ? "Payment expired" : "Payment did not go through"}
      subtitle="You were not charged."
    >
      <Link href={`/${handle}`} className="text-primary font-bold">
        Go back and try again
      </Link>
    </PayShell>
  );
}

export default function DonePage(props: PageProps<"/[handle]/done">) {
  return (
    <Suspense fallback={null}>
      <DoneContent params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
