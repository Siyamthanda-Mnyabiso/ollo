import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BuyerPage } from "@/components/pay/buyer";
import { CartView } from "@/components/pay/cart-view";
import { BuyerSkeleton } from "@/components/pay/skeleton";
import { getSellerByHandle } from "@/lib/payments/service";

/** The Cart frame. */
async function CartContent({ params }: { params: PageProps<"/[handle]/cart">["params"] }) {
  const { handle } = await params;
  const seller = await getSellerByHandle(handle);
  if (!seller || seller.status === "suspended") notFound();
  return (
    <BuyerPage
      name={seller.displayName}
      logoUrl={seller.logoUrl}
      handle={seller.handle}
      backHref={`/${seller.handle}`}
      title="Cart"
      plainFooter
      narrow
    >
      <h1 className="text-[32px] leading-10 font-bold tracking-[-0.005em]">Your cart</h1>
      <CartView handle={seller.handle} />
    </BuyerPage>
  );
}

export default function CartPage(props: PageProps<"/[handle]/cart">) {
  return (
    <Suspense fallback={<BuyerSkeleton />}>
      <CartContent params={props.params} />
    </Suspense>
  );
}
