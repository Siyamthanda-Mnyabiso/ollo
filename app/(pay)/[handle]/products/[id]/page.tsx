import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BuyerSkeleton } from "@/components/pay/skeleton";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { items, sellers } from "@/lib/db/schema";
import { BuyerPage, ImagePlaceholder } from "@/components/pay/buyer";
import { ProductPurchase } from "@/components/pay/product-purchase";
import { contactFor } from "@/lib/orders/contact";
import { formatRandCompact } from "@/lib/money";
import { getSellerByHandle } from "@/lib/payments/service";

/*
 * The Product page frame. The app doesn't store a description, extra photos or item options yet,
 * so the description line, the four thumbnails and the Length chips are the frame's own.
 */
const FRAME_DESCRIPTION =
  "Silky straight bundles, 100% human hair. Soft, tangle free and easy to style.";

async function ProductContent({
  params,
}: {
  params: PageProps<"/[handle]/products/[id]">["params"];
}) {
  const { handle, id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [seller, item] = await Promise.all([
    getSellerByHandle(handle),
    db
      .select({ item: items })
      .from(items)
      .innerJoin(sellers, eq(sellers.id, items.sellerId))
      .where(
        and(eq(items.id, id), eq(sellers.handle, handle.toLowerCase()), eq(items.active, true)),
      )
      .limit(1)
      .then((r) => r[0]?.item),
  ]);
  if (!seller || seller.status === "suspended" || !item) notFound();
  return (
    <BuyerPage
      name={seller.displayName}
      logoUrl={seller.logoUrl}
      handle={seller.handle}
      backHref={`/${seller.handle}`}
      plainFooter
    >
      <div className="grid gap-6 md:grid-cols-2 md:gap-16">
        <div className="flex flex-col gap-4">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt=""
              className="h-80 w-full rounded-xl object-cover md:h-[480px]"
            />
          ) : (
            <ImagePlaceholder label="Product photo" className="h-80 rounded-xl md:h-[480px]" />
          )}
          <div className="hidden grid-cols-4 gap-3 md:grid">
            {[0, 1, 2, 3].map((n) => (
              <ImagePlaceholder key={n} label="" className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 md:gap-6">
          <h1 className="text-[32px] leading-10 font-bold tracking-[-0.005em] md:text-[40px] md:leading-[48px]">
            {item.name}
          </h1>
          <p className="text-2xl leading-8 font-bold md:text-[32px] md:leading-10 md:tracking-[-0.005em]">
            {formatRandCompact(item.priceCents)}
          </p>
          <p className="text-base leading-6 text-[var(--ollo-ink-500)]">{FRAME_DESCRIPTION}</p>
          <ProductPurchase
            handle={seller.handle}
            itemId={item.id}
            name={item.name}
            priceCents={item.priceCents}
            contact={contactFor(seller, `Hi, I have a question about ${item.name}`)}
          />
        </div>
      </div>
    </BuyerPage>
  );
}

export default function ProductPage(props: PageProps<"/[handle]/products/[id]">) {
  return (
    <Suspense fallback={<BuyerSkeleton />}>
      <ProductContent params={props.params} />
    </Suspense>
  );
}
