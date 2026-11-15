import type { ReactNode } from "react";
import { BadgeCheck, CircleAlert, Clock, Check, Lock, ShieldCheck } from "lucide-react";
import { Wordmark } from "@/components/onboarding/ui";

/** The page around every pay page screen: logo on top, a white card in the middle. */
export function PayFrame({ children }: { children: ReactNode }) {
  return (
    <main className="bg-card md:bg-background flex min-h-screen flex-col">
      <header className="flex h-16 items-center px-4 md:h-20 md:px-10">
        <Wordmark />
      </header>
      <div className="flex flex-1 items-start justify-center pb-16 md:items-center md:px-4">
        <div className="bg-card w-full max-w-[520px] space-y-6 px-4 pt-2 md:rounded-3xl md:p-12 md:shadow-sm">
          {children}
        </div>
      </div>
    </main>
  );
}

/** A result or message screen: a title, a sentence and optional extra content. */
export function PayShell({
  title,
  subtitle,
  status,
  children,
}: {
  title: string;
  subtitle?: string;
  status?: "ok" | "bad" | "wait";
  children?: ReactNode;
}) {
  const Icon = status === "ok" ? Check : status === "bad" ? CircleAlert : Clock;
  const tone =
    status === "bad"
      ? "bg-red-50 text-[var(--ollo-danger)]"
      : "bg-[var(--ollo-mint-50)] text-[var(--ollo-teal-700)]";
  return (
    <PayFrame>
      {status ? (
        <span
          aria-hidden="true"
          className={`flex size-[72px] items-center justify-center rounded-full ${tone}`}
        >
          <Icon className="size-8" />
        </span>
      ) : null}
      <div className="space-y-3">
        <h1 className="text-primary text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle ? <p className="text-muted-foreground text-base">{subtitle}</p> : null}
      </div>
      {children}
    </PayFrame>
  );
}

/** Seller logo (or first letter), business name, verified badge and a short bio. */
export function PaySeller({
  name,
  bio,
  logoUrl,
  verified,
}: {
  name: string;
  bio?: string | null;
  logoUrl?: string | null;
  verified: boolean;
}) {
  return (
    <section aria-label="Seller" className="space-y-3">
      <div className="flex items-center gap-4">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="size-16 rounded-full object-cover" />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-16 items-center justify-center rounded-full bg-[var(--ollo-teal-900)] text-2xl font-bold text-white"
          >
            {name.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="space-y-2">
          <h1 className="text-primary text-2xl font-bold tracking-tight">{name}</h1>
          {verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ollo-mint-50)] px-3 py-1 text-sm font-bold text-[var(--ollo-teal-700)]">
              <BadgeCheck className="size-4" aria-hidden="true" />
              Verified seller
            </span>
          ) : null}
        </div>
      </div>
      {bio ? <p className="text-muted-foreground">{bio}</p> : null}
    </section>
  );
}

/** The lines every pay page ends with: secure payment, the address check and a report link. */
export function PayTrust({ handle }: { handle: string }) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
        <Lock className="size-4" aria-hidden="true" />
        Secure payment powered by Stitch
      </p>
      <p className="flex items-center gap-3 rounded-xl bg-[var(--ollo-mint-50)] p-4">
        <ShieldCheck className="text-primary size-6 shrink-0" aria-hidden="true" />
        Check the address says ollopay.co.za before you pay.
      </p>
      <p className="text-center">
        <a
          href={`mailto:hello@ollopay.co.za?subject=${encodeURIComponent(`Report seller ${handle}`)}`}
          className="text-primary font-bold"
        >
          Report this seller
        </a>
      </p>
    </div>
  );
}
