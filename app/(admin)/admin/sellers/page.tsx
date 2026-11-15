import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/admin";
import { listSellers } from "@/lib/admin/queries";
import { resolveLimits } from "@/lib/limits";
import { formatRand } from "@/lib/money";

export const metadata = { title: "Sellers" };

async function SellersContent() {
  await requireAdmin();
  const rows = await listSellers();
  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <h1 className="text-primary text-3xl font-bold">Sellers</h1>
      <ul className="divide-border bg-card mt-6 divide-y rounded-2xl">
        {rows.map((s) => {
          const limits = resolveLimits(s);
          return (
            <li key={s.id}>
              <Link
                href={`/admin/sellers/${s.id}`}
                className="flex flex-wrap justify-between gap-2 p-4"
              >
                <span>
                  <span className="block font-semibold">{s.displayName}</span>
                  <span className="text-muted-foreground block text-sm">{s.handle}</span>
                </span>
                <span className="text-muted-foreground text-sm">
                  {formatRand(limits.perPaymentCents)} per payment, {formatRand(limits.perDayCents)}{" "}
                  per day
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

export default function SellersPage() {
  return (
    <Suspense fallback={null}>
      <SellersContent />
    </Suspense>
  );
}
