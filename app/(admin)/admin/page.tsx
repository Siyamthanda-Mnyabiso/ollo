import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata = { title: "Admin" };

async function AdminContent() {
  await requireAdmin();
  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      <h1 className="text-primary text-3xl font-bold">Admin</h1>
      <p className="text-muted-foreground mt-2">
        <Link href="/admin/sellers" className="text-primary font-bold">
          Sellers and limits
        </Link>
      </p>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminContent />
    </Suspense>
  );
}
