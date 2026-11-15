import { Suspense } from "react";
import { Card } from "@/components/dashboard/shell";
import { MethodsForm } from "@/components/dashboard/methods-form";
import { requireSeller } from "@/lib/dashboard/queries";
import { enabledMethods } from "@/lib/payments/service";

export const metadata = { title: "Payment methods" };

async function MethodsContent() {
  const { seller } = await requireSeller();
  const enabled = await enabledMethods(seller.id);
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-primary text-3xl font-bold tracking-tight">Payment methods</h1>
      <Card>
        <MethodsForm enabled={enabled} />
      </Card>
    </div>
  );
}

export default function PaymentMethodsPage() {
  return (
    <Suspense fallback={null}>
      <MethodsContent />
    </Suspense>
  );
}
