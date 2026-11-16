import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BuyerSkeleton } from "@/components/pay/skeleton";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { items, sellers } from "@/lib/db/schema";
import { BuyerPage, ImagePlaceholder, SellerBlock } from "@/components/pay/buyer";
import { formatRandCompact } from "@/lib/money";
import { getSellerByHandle } from "@/lib/payments/service";

/** The Shop page frame. */
async function ShopContent({ params }: { params: PageProps<"/[handle]">["params"] }) {
  const { handle } = await params;
  // Both lookups go by handle, so they run together instead of one after the other.
  const [seller, rows] = await Promise.all([
    getSellerByHandle(handle),
    db
      .select({ item: items })
      .from(items)
      .innerJoin(sellers, eq(sellers.id, items.sellerId))
      .where(and(eq(sellers.handle, handle.toLowerCase()), eq(items.active, true)))
      .orderBy(items.name)
      .then((r) => r.map((x) => x.item)),
  ]);
  if (!seller || seller.status === "suspended") notFound();
  return (
    <BuyerPage name={seller.displayName} logoUrl={seller.logoUrl} handle={seller.handle}>
      <ImagePlaceholder label="Shop banner" className="h-40 rounded-2xl md:h-60" />
      <SellerBlock
        name={seller.displayName}
        bio={seller.bio}
        logoUrl={seller.logoUrl}
        verified={seller.status === "verified"}
      />
      <div role="tablist" aria-label="Sections" className="flex gap-6 border-b border-[#d5dde3]">
        <span
          role="tab"
          aria-selected="true"
          className="flex h-12 items-center border-b-[3px] border-[var(--ollo-mint-500)] text-base leading-6 font-bold text-black"
        >
          Products
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4 md:gap-6">
        {rows.map((i) => (
          <li key={i.id}>
            <Link
              href={`/${seller.handle}/products/${i.id}`}
              className="flex flex-col gap-2 text-base leading-6"
            >
              {i.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={i.imageUrl}
                  alt=""
                  className="h-40 w-full rounded-xl object-cover md:h-[220px]"
                />
              ) : (
                <ImagePlaceholder label={i.name} className="h-40 rounded-xl md:h-[220px]" />
              )}
              <span className="font-bold text-[var(--ollo-ink-900)]">{i.name}</span>
              <span className="text-[var(--ollo-ink-500)]">{formatRandCompact(i.priceCents)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </BuyerPage>
  );
}

export default function ShopPage(props: PageProps<"/[handle]">) {
  return (
    <Suspense fallback={<BuyerSkeleton />}>
      <ShopContent params={props.params} />
    </Suspense>
  );
}
