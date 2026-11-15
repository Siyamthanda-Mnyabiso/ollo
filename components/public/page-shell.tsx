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
  active,
  children,
}: {
  live: boolean;
  title: string;
  subtitle?: string;
  /** The page's own nav link, shown bold. */
  active?: string;
  children: ReactNode;
}) {
  const copy = getCopy(live);
  return (
    <div className={`${TEAL} text-[var(--ollo-ink-900)]`}>
      <main>
        <HeroFrame nav={copy.nav} variant="inner" active={active}>
          <div className="relative mt-14 flex flex-col gap-4 px-5 pb-8 md:mt-0 md:max-w-[956px] md:pt-[140px] md:pr-0 md:pb-0 md:pl-[136px]">
            <h1 className="text-4xl leading-10 font-bold md:text-[56px] md:leading-[60px]">
              {title}
            </h1>
            {subtitle ? <p className="text-base md:text-xl md:leading-[30px]">{subtitle}</p> : null}
          </div>
        </HeroFrame>
        <div className="rounded-t-[40px] bg-[var(--ollo-surface)] px-4 py-12 md:px-40 md:py-24">
          <div className="mx-auto flex max-w-[1120px] flex-col gap-12 md:gap-16">{children}</div>
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
  active,
  children,
}: {
  title: string;
  subtitle?: string;
  active?: string;
  children: ReactNode | ((live: boolean) => ReactNode);
}) {
  await connection();
  const live = getEnv().PAYMENTS_LIVE;
  return (
    <PublicPage live={live} title={title} subtitle={subtitle} active={active}>
      {typeof children === "function" ? children(live) : children}
    </PublicPage>
  );
}
