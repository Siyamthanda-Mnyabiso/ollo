import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BuyerPage } from "@/components/pay/buyer";
import { CheckoutForm } from "@/components/pay/checkout-form";
import { BuyerSkeleton } from "@/components/pay/skeleton";
import { getSellerByHandle } from "@/lib/payments/service";

/** Today and the next two days, written like the frame's chips: "Sat 15 Nov". */
function nextDays(): string[] {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Africa/Johannesburg",
  });
  const now = Date.now();
  return [0, 1, 2].map((n) => fmt.format(new Date(now + n * 86_400_000)).replace(",", ""));
}

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
      <CheckoutForm handle={seller.handle} days={nextDays()} />
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
