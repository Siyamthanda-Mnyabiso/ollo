import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { OlloLogo } from "@/components/brand/logo";
import { SidebarNav, TabBar } from "@/components/dashboard/nav";
import { cn } from "@/lib/utils";

export const ctaLinkClass =
  "inline-flex h-12 items-center justify-center rounded-xl bg-[var(--ollo-mint-500)] px-6 text-base font-bold text-[var(--ollo-teal-900)] hover:bg-[var(--ollo-mint-500)]/90";
export const outlineLinkClass =
  "inline-flex h-12 items-center justify-center rounded-xl border border-primary px-6 text-base font-bold text-primary hover:bg-accent";

/**
 * The dashboard frame from the Figma Home frame: a 264 wide sidebar on desktop, a header and a
 * bottom tab bar on a phone. The page content sits in the 1176 wide content area.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  // "Your pay page" lists the pages that exist for it. Turn it on when /dashboard/appearance is built.
  const showPayPage = false;
  return (
    <div className="min-h-screen bg-[var(--ollo-surface)] text-[var(--ollo-ink-900)]">
      <aside className="fixed inset-y-0 left-0 hidden w-[264px] flex-col gap-2 overflow-y-auto bg-white px-4 py-8 md:flex">
        <Link href="/dashboard" aria-label="Ollo home" className="flex h-14 items-start px-4 pb-6">
          <OlloLogo className="h-8 text-[var(--ollo-teal-900)]" />
        </Link>
        <Suspense fallback={null}>
          <SidebarNav showPayPage={showPayPage} />
        </Suspense>
      </aside>
      <header className="flex h-16 items-center justify-between bg-white px-4 md:hidden">
        <Link href="/dashboard" aria-label="Ollo home">
          <OlloLogo className="h-7 text-[var(--ollo-teal-900)]" />
        </Link>
      </header>
      <main className="flex flex-col gap-6 px-4 pt-6 pb-[99px] md:gap-8 md:py-10 md:pr-12 md:pb-10 md:pl-[312px]">
        {children}
      </main>
      <Suspense fallback={null}>
        <TabBar showPayPage={showPayPage} />
      </Suspense>
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
