import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { items } from "@/lib/db/schema";
import { formatRand } from "@/lib/money";
import { PayForm } from "@/components/pay/pay-form";
import { PayFrame, PaySeller, PayTrust } from "@/components/pay/page-shell";
import { enabledMethods, getSellerByHandle } from "@/lib/payments/service";

async function PayContent({ params }: { params: PageProps<"/[handle]">["params"] }) {
  const seller = await getSellerByHandle((await params).handle);
  if (!seller || seller.status === "suspended") notFound();
  const methods = await enabledMethods(seller.id);
  const rows = await db
    .select()
    .from(items)
    .where(and(eq(items.sellerId, seller.id), eq(items.active, true)))
    .orderBy(items.name);
  return (
    <PayFrame>
      <PaySeller
        name={seller.displayName}
        bio={seller.bio}
        logoUrl={seller.logoUrl}
        verified={seller.status === "verified"}
      />
      <PayForm
        handle={seller.handle}
        methods={methods}
        idempotencyKey={randomUUID()}
        items={rows.map((i) => ({
          id: i.id,
          name: i.name,
          priceLabel: formatRand(i.priceCents),
          amountText: (i.priceCents / 100).toFixed(2).replace(".", ","),
        }))}
      />
      <PayTrust handle={seller.handle} />
    </PayFrame>
  );
}

export default function PayPage(props: PageProps<"/[handle]">) {
  return (
    <Suspense fallback={null}>
      <PayContent params={props.params} />
    </Suspense>
  );
}
