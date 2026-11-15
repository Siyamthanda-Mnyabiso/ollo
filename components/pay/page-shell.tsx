import type { ReactNode } from "react";
import { Wordmark } from "@/components/onboarding/ui";

export function PayShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main className="bg-background flex min-h-screen flex-col">
      <header className="flex h-20 items-center px-6 md:px-10">
        <Wordmark />
      </header>
      <div className="flex flex-1 items-start justify-center px-4 pb-16 md:items-center">
        <div className="bg-card w-full max-w-[520px] rounded-3xl p-6 shadow-sm md:p-8">
          <h1 className="text-primary text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle ? <p className="text-muted-foreground mt-2 text-base">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
