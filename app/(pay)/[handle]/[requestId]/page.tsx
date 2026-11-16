import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { BuyerPage, SellerBlock } from "@/components/pay/buyer";
import { PayForm } from "@/components/pay/pay-form";
import { PayShell } from "@/components/pay/page-shell";
import { db } from "@/lib/db";
import { paymentRequests } from "@/lib/db/schema";
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
    <BuyerPage name={seller.displayName} logoUrl={seller.logoUrl} handle={seller.handle}>
      <SellerBlock
        name={seller.displayName}
        bio={seller.bio}
        logoUrl={seller.logoUrl}
        verified={seller.status === "verified"}
      />
      <PayForm
        handle={seller.handle}
        requestId={request.id}
        fixedAmountCents={request.amountCents}
        summaryTitle={request.description || "Payment request"}
        summarySub={
          request.expiresAt
            ? `Open until ${request.expiresAt.toLocaleDateString("en-ZA", { day: "numeric", month: "long" })}`
            : undefined
        }
        methods={methods}
        idempotencyKey={randomUUID()}
      />
    </BuyerPage>
  );
}

export default function RequestPayPage(props: PageProps<"/[handle]/[requestId]">) {
  return (
    <Suspense fallback={null}>
      <RequestPayContent params={props.params} />
    </Suspense>
  );
}
