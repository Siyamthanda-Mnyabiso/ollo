import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/onboarding/ui";
import { cn } from "@/lib/utils";

export const ctaLinkClass =
  "inline-flex h-12 items-center justify-center rounded-xl bg-[var(--ollo-mint-500)] px-6 text-base font-bold text-[var(--ollo-teal-900)] hover:bg-[var(--ollo-mint-500)]/90";
export const outlineLinkClass =
  "inline-flex h-12 items-center justify-center rounded-xl border border-primary px-6 text-base font-bold text-primary hover:bg-accent";

const NAV = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/requests", label: "Requests" },
  { href: "/dashboard/items", label: "Items" },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background min-h-screen">
      <header className="border-border bg-card border-b">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3 md:px-8">
          <Link href="/dashboard">
            <Wordmark />
          </Link>
          <nav aria-label="Dashboard" className="flex gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="text-foreground hover:bg-accent rounded-lg px-3 py-2 text-base font-semibold"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cn("bg-card rounded-2xl p-5 shadow-sm md:p-6", className)}>
      {children}
    </section>
  );
}
