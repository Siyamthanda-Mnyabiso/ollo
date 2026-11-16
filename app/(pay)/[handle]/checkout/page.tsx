import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BuyerPage } from "@/components/pay/buyer";
import { CheckoutForm } from "@/components/pay/checkout-form";
import { BuyerSkeleton } from "@/components/pay/skeleton";
import { fulfilmentOptions, offeredDates } from "@/lib/orders/availability";
import { getSellerByHandle } from "@/lib/payments/service";

/** The Checkout details frame. */
async function CheckoutContent({ params }: { params: PageProps<"/[handle]/checkout">["params"] }) {
  const { handle } = await params;
  const seller = await getSellerByHandle(handle);
  if (!seller || seller.status === "suspended") notFound();
  return (
    <BuyerPage
      name={seller.displayName}
      logoUrl={seller.logoUrl}
      handle={seller.handle}
      backHref={`/${seller.handle}/cart`}
      title="Checkout"
      plainFooter
    >
      <h1 className="text-[32px] leading-10 font-bold tracking-[-0.005em]">Checkout</h1>
      <CheckoutForm
        handle={seller.handle}
        options={{
          ...fulfilmentOptions(seller),
          collectionAddress: seller.collectionAddress,
          deliveryFeeCents: seller.deliveryFeeCents ?? 0,
          dates: offeredDates(seller, new Date()),
          slots: seller.deliverySlots,
        }}
      />
    </BuyerPage>
  );
}

export default function CheckoutPage(props: PageProps<"/[handle]/checkout">) {
  return (
    <Suspense fallback={<BuyerSkeleton />}>
      <CheckoutContent params={props.params} />
    </Suspense>
  );
}
