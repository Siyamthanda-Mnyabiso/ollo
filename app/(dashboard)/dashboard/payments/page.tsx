import Link from "next/link";
import { Suspense } from "react";
import { Card } from "@/components/dashboard/shell";
import { listPayments, PAYMENT_STATUS_LABEL, requireSeller } from "@/lib/dashboard/queries";
import { METHOD_LABELS } from "@/lib/payments/labels";
import { formatRand } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata = { title: "Payments" };

type Status = keyof typeof PAYMENT_STATUS_LABEL;
const FILTERS: { key: Status | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "succeeded", label: "Paid" },
  { key: "pending", label: "Waiting" },
  { key: "refunded", label: "Refunded" },
  { key: "failed", label: "Failed" },
];

async function PaymentsContent({
  searchParams,
}: {
  searchParams: PageProps<"/dashboard/payments">["searchParams"];
}) {
  const { seller } = await requireSeller();
  const sp = await searchParams;
  const raw = typeof sp.status === "string" ? sp.status : "all";
  const status = (Object.keys(PAYMENT_STATUS_LABEL) as Status[]).find((k) => k === raw);
  const rows = await listPayments(seller.id, status);

  return (
    <div className="space-y-6">
      <h1 className="text-primary text-3xl font-bold tracking-tight">Payments</h1>
      <div role="tablist" aria-label="Filter" className="flex flex-wrap gap-1">
        {FILTERS.map((f) => {
          const active = (status ?? "all") === f.key;
          return (
            <Link
              key={f.key}
              role="tab"
              aria-selected={active}
              href={f.key === "all" ? "/dashboard/payments" : `/dashboard/payments?status=${f.key}`}
              className={cn(
                "rounded-lg px-3 py-2 text-base font-semibold",
                active ? "bg-accent text-primary" : "text-muted-foreground hover:bg-accent",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>
      <Card>
        {rows.length === 0 ? (
          <p className="text-muted-foreground">No payments here yet.</p>
        ) : (
          <ul className="divide-border divide-y">
            {rows.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/dashboard/payments/${p.id}`}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <span>
                    <span className="block font-semibold">{p.buyerName || "Customer"}</span>
                    <span className="text-muted-foreground block text-sm">
                      {p.itemName ? `${p.itemName}, ` : ""}
                      {METHOD_LABELS[p.method]} on {p.createdAt.toLocaleDateString("en-ZA")}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-bold">{formatRand(p.amountCents)}</span>
                    <span className="text-muted-foreground block text-sm">
                      {PAYMENT_STATUS_LABEL[p.status]}
                    </span>
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

export default function PaymentsPage(props: PageProps<"/dashboard/payments">) {
  return (
    <Suspense fallback={null}>
      <PaymentsContent searchParams={props.searchParams} />
    </Suspense>
  );
}
