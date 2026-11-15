import Link from "next/link";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { HeroFrame, JoinBand, SiteFooter, TEAL } from "@/components/public/site";
import { getEnv } from "@/lib/env";
import { getCopy } from "@/lib/public/copy";

/** The frame every public page except the landing page uses: hero, body, join band, footer. */
export function PublicPage({
  live,
  title,
  subtitle,
  children,
}: {
  live: boolean;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const copy = getCopy(live);
  return (
    <div className={`${TEAL} text-[var(--ollo-ink-900)]`}>
      <main>
        <HeroFrame nav={copy.nav} variant="inner">
          <div className="relative flex flex-col gap-4 px-6 pt-20 pb-12 md:max-w-[820px] md:px-[88px] md:pt-[170px] md:pb-0">
            <h1 className="text-4xl leading-tight font-bold tracking-tight md:text-[56px]">
              {title}
            </h1>
            {subtitle ? <p className="text-xl">{subtitle}</p> : null}
          </div>
        </HeroFrame>
        <div className="bg-[var(--ollo-surface)] px-4 py-16 md:px-40 md:py-24">
          <div className="mx-auto flex max-w-[1120px] flex-col gap-16">{children}</div>
        </div>
        <JoinBand join={copy.join} />
      </main>
      <SiteFooter footer={copy.footer} />
    </div>
  );
}

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-14 items-center justify-center rounded-full bg-[var(--ollo-teal-900)] px-8 font-bold whitespace-nowrap text-white"
    >
      {children}
    </Link>
  );
}

/** A public page that reads the PAYMENTS_LIVE flag on every request. Use it inside <Suspense>. */
export async function LivePage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  await connection();
  return (
    <PublicPage live={getEnv().PAYMENTS_LIVE} title={title} subtitle={subtitle}>
      {children}
    </PublicPage>
  );
}
