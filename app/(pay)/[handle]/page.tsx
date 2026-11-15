import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PayForm } from "@/components/pay/pay-form";
import { PayShell } from "@/components/pay/page-shell";
import { enabledMethods, getSellerByHandle } from "@/lib/payments/service";

async function PayContent({ params }: { params: PageProps<"/[handle]">["params"] }) {
  const seller = await getSellerByHandle((await params).handle);
  if (!seller || seller.status === "suspended") notFound();
  const methods = await enabledMethods(seller.id);
  return (
    <PayShell
      title={`Pay ${seller.displayName}`}
      subtitle="Choose an amount and how you want to pay."
    >
      <PayForm handle={seller.handle} methods={methods} idempotencyKey={randomUUID()} />
    </PayShell>
  );
}

export default function PayPage(props: PageProps<"/[handle]">) {
  return (
    <Suspense fallback={null}>
      <PayContent params={props.params} />
    </Suspense>
  );
}
