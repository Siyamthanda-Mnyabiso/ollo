import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { LimitsForm } from "@/components/admin/limits-form";
import { requireAdmin } from "@/lib/auth/admin";
import { getSellerById } from "@/lib/admin/queries";
import { DEFAULT_SELLER_LIMITS } from "@/lib/limits";

export const metadata = { title: "Seller" };

const rands = (cents: number | null) => (cents === null ? "" : String(cents / 100));

async function SellerContent({ params }: { params: PageProps<"/admin/sellers/[id]">["params"] }) {
  await requireAdmin();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const seller = await getSellerById(id.data);
  if (!seller) notFound();
  return (
    <main className="mx-auto w-full max-w-xl p-8">
      <h1 className="text-primary text-3xl font-bold">{seller.displayName}</h1>
      <p className="text-muted-foreground mt-1">{seller.handle}</p>
      <div className="bg-card mt-6 rounded-2xl p-6">
        <LimitsForm
          sellerId={seller.id}
          perPayment={rands(seller.limitPerPaymentCents)}
          perDay={rands(seller.limitPerDayCents)}
          defaults={{
            perPayment: rands(DEFAULT_SELLER_LIMITS.perPaymentCents),
            perDay: rands(DEFAULT_SELLER_LIMITS.perDayCents),
          }}
        />
      </div>
    </main>
  );
}

export default function SellerPage(props: PageProps<"/admin/sellers/[id]">) {
  return (
    <Suspense fallback={null}>
      <SellerContent params={props.params} />
    </Suspense>
  );
}
