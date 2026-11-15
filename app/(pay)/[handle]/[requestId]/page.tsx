import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { PayForm } from "@/components/pay/pay-form";
import { PayFrame, PaySeller, PayShell, PayTrust } from "@/components/pay/page-shell";
import { db } from "@/lib/db";
import { paymentRequests } from "@/lib/db/schema";
import { formatRand } from "@/lib/money";
import { enabledMethods, getSellerByHandle } from "@/lib/payments/service";

async function RequestPayContent({
  params,
}: {
  params: PageProps<"/[handle]/[requestId]">["params"];
}) {
  const { handle, requestId } = await params;
  const id = z.uuid().safeParse(requestId);
  const seller = await getSellerByHandle(handle);
  if (!id.success || !seller || seller.status === "suspended") notFound();
  const [request] = await db
    .select()
    .from(paymentRequests)
    .where(and(eq(paymentRequests.id, id.data), eq(paymentRequests.sellerId, seller.id)))
    .limit(1);
  if (!request) notFound();

  const expired = request.status === "open" && request.expiresAt && request.expiresAt < new Date();
  if (request.status !== "open" || expired) {
    const text =
      request.status === "paid"
        ? "This request has already been paid."
        : request.status === "cancelled"
          ? "The seller cancelled this request."
          : "This request has expired. Ask the seller for a new one.";
    return (
      <PayShell title={`${seller.displayName}`} subtitle={text}>
        <p className="text-muted-foreground">Nothing is due on this link.</p>
      </PayShell>
    );
  }

  const methods = await enabledMethods(seller.id);
  return (
    <PayFrame>
      <PaySeller
        name={seller.displayName}
        bio={seller.bio}
        logoUrl={seller.logoUrl}
        verified={seller.status === "verified"}
      />
      <section aria-label="Payment request">
        <p className="text-muted-foreground font-bold">Payment request</p>
        <p className="text-5xl font-extrabold tracking-tight" data-testid="request-amount">
          {formatRand(request.amountCents)}
        </p>
        {request.description ? (
          <p className="text-muted-foreground mt-1">{request.description}</p>
        ) : null}
        {request.expiresAt ? (
          <p className="text-muted-foreground">
            Open until{" "}
            {request.expiresAt.toLocaleDateString("en-ZA", { day: "numeric", month: "long" })}
          </p>
        ) : null}
      </section>
      <PayForm
        handle={seller.handle}
        requestId={request.id}
        fixedAmountLabel={formatRand(request.amountCents)}
        methods={methods}
        idempotencyKey={randomUUID()}
      />
      <PayTrust handle={seller.handle} />
    </PayFrame>
  );
}

export default function RequestPayPage(props: PageProps<"/[handle]/[requestId]">) {
  return (
    <Suspense fallback={null}>
      <RequestPayContent params={props.params} />
    </Suspense>
  );
}
