import { Suspense } from "react";
import { Card } from "@/components/dashboard/shell";
import { RequestForm } from "@/components/dashboard/request-form";
import { requireSeller } from "@/lib/dashboard/queries";

export const metadata = { title: "Request payment" };

async function NewRequestContent() {
  await requireSeller();
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-primary text-3xl font-bold tracking-tight">Request payment</h1>
      <Card>
        <RequestForm />
      </Card>
    </div>
  );
}

export default function NewRequestPage() {
  return (
    <Suspense fallback={null}>
      <NewRequestContent />
    </Suspense>
  );
}
