import Link from "next/link";
import { Suspense } from "react";
import { Card, ctaLinkClass } from "@/components/dashboard/shell";
import { listRequests, requireSeller } from "@/lib/dashboard/queries";
import { formatRand } from "@/lib/money";

export const metadata = { title: "Requests" };

const STATUS = { open: "Open", paid: "Paid", expired: "Expired", cancelled: "Cancelled" } as const;

async function RequestsContent() {
  const { seller } = await requireSeller();
  const requests = await listRequests(seller.id);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-primary text-3xl font-bold tracking-tight">Requests</h1>
        <Link href="/dashboard/requests/new" className={ctaLinkClass}>
          Request payment
        </Link>
      </div>
      <Card>
        {requests.length === 0 ? (
          <p className="text-muted-foreground">No requests yet.</p>
        ) : (
          <ul className="divide-border divide-y">
            {requests.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/dashboard/requests/${r.id}`}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <span>
                    <span className="block font-semibold">
                      {r.description || "Payment request"}
                    </span>
                    <span className="text-muted-foreground block text-sm">
                      {r.createdAt.toLocaleDateString("en-ZA")}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-bold">{formatRand(r.amountCents)}</span>
                    <span className="text-muted-foreground block text-sm">{STATUS[r.status]}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export default function RequestsPage() {
  return (
    <Suspense fallback={null}>
      <RequestsContent />
    </Suspense>
  );
}
