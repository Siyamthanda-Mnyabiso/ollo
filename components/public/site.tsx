import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { DesktopHeaderSearch, MobileHeaderSearch } from "@/components/public/header-search";
import { ParallaxLayer } from "@/components/public/parallax";
import type { LandingCopy } from "@/lib/public/copy";

/*
 * Pieces shared by the landing page and the other public pages. The hero shapes are the paths
 * exported from the Figma hero vectors ("Parallax back / Stage"), used as they are.
 */
export const TEAL = "bg-[var(--ollo-teal-900)]";
export const MINT_GRADIENT = "bg-[linear-gradient(160deg,#00c781_0%,#d3f6e7_100%)]";
export const PILL =
  "inline-flex h-14 items-center justify-center rounded-full px-8 text-base font-bold whitespace-nowrap";

/** Hero vector, home page (1392 x 900): notches for the nav, the log in tab and "See how it works". */
const HOME_SHAPE =
  "M0 40C0 29.3913 4.21427 19.2172 11.7157 11.7157C19.2172 4.21427 29.3913 0 40 0L356 0C362.365 0 368.47 2.52856 372.971 7.02944C377.471 11.5303 380 17.6348 380 24V40C380 46.3652 382.529 52.4697 387.029 56.9706C391.53 61.4714 397.635 64 404 64H988C994.365 64 1000.47 61.4714 1004.97 56.9706C1009.47 52.4697 1012 46.3652 1012 40V24C1012 17.6348 1014.53 11.5303 1019.03 7.02944C1023.53 2.52856 1029.63 0 1036 0L1156 0C1162.37 0 1168.47 2.52856 1172.97 7.02944C1177.47 11.5303 1180 17.6348 1180 24V32C1180 38.3652 1182.53 44.4697 1187.03 48.9706C1191.53 53.4714 1197.63 56 1204 56H1352C1362.61 56 1372.78 60.2143 1380.28 67.7157C1387.79 75.2172 1392 85.3913 1392 96V860C1392 870.609 1387.79 880.783 1380.28 888.284C1372.78 895.786 1362.61 900 1352 900H996C989.635 900 983.53 897.471 979.029 892.971C974.529 888.47 972 882.365 972 876V844C972 837.635 969.471 831.53 964.971 827.029C960.47 822.529 954.365 820 948 820H444C437.635 820 431.53 822.529 427.029 827.029C422.529 831.53 420 837.635 420 844V876C420 882.365 417.471 888.47 412.971 892.971C408.47 897.471 402.365 900 396 900H40C29.3913 900 19.2172 895.786 11.7157 888.284C4.21427 880.783 0 870.609 0 860L0 40Z";

/** Hero vector, inner pages (1392 x 380): the same top notches, no bottom notch. */
const INNER_SHAPE =
  "M0 40C0 29.3913 4.21427 19.2172 11.7157 11.7157C19.2172 4.21427 29.3913 0 40 0L356 0C362.365 0 368.47 2.52856 372.971 7.02944C377.471 11.5303 380 17.6348 380 24V40C380 46.3652 382.529 52.4697 387.029 56.9706C391.53 61.4714 397.635 64 404 64H988C994.365 64 1000.47 61.4714 1004.97 56.9706C1009.47 52.4697 1012 46.3652 1012 40V24C1012 17.6348 1014.53 11.5303 1019.03 7.02944C1023.53 2.52856 1029.63 0 1036 0L1156 0C1162.37 0 1168.47 2.52856 1172.97 7.02944C1177.47 11.5303 1180 17.6348 1180 24V32C1180 38.3652 1182.53 44.4697 1187.03 48.9706C1191.53 53.4714 1197.63 56 1204 56H1352C1362.61 56 1372.78 60.2143 1380.28 67.7157C1387.79 75.2172 1392 85.3913 1392 96V340C1392 350.609 1387.79 360.783 1380.28 368.284C1372.78 375.786 1362.61 380 1352 380H40C29.3913 380 19.2172 375.786 11.7157 368.284C4.21427 360.783 0 350.609 0 340L0 40Z";

export function Wordmark({
  light = true,
  className = "",
}: {
  light?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`text-3xl font-extrabold tracking-tight ${light ? "text-white" : "text-[var(--ollo-teal-900)]"} ${className}`}
    >
      ollo
    </span>
  );
}

const NAV_LINKS = (nav: LandingCopy["nav"]) => [
  { label: nav.howItWorks, href: "/#how-it-works" },
  { label: nav.pricing, href: "/pricing" },
  { label: nav.about, href: "/about" },
  { label: nav.helpCentre, href: "/help" },
];

/** The hero's header. On desktop it sits in the notches of the hero shape, on a phone in plain tabs. */
function HeroHeader({ nav }: { nav: LandingCopy["nav"] }) {
  const links = NAV_LINKS(nav);
  return (
    <>
      {/* Desktop: positions are the notch positions in the 1392 wide design, as percentages. */}
      <div className="absolute top-4 left-9 z-10 hidden md:block">
        <Link href="/" aria-label="Ollo home">
          <Wordmark light={false} />
        </Link>
      </div>
      <nav
        aria-label="Main"
        className="absolute top-0 left-[27.3%] z-10 hidden h-16 w-[45.4%] items-center justify-center gap-10 text-white md:flex"
      >
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            {l.label}
          </Link>
        ))}
      </nav>
      <DesktopHeaderSearch logIn={nav.logIn} />
      {/* Phone */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-4 md:hidden">
        <Link href="/" aria-label="Ollo home">
          <Wordmark light={false} />
        </Link>
        <MobileHeaderSearch />
        <details className="relative">
          <summary className="flex h-11 cursor-pointer list-none items-center rounded-full bg-[var(--ollo-teal-900)] px-5 font-bold text-white">
            Menu
          </summary>
          <nav
            aria-label="Main"
            className="absolute right-0 z-20 mt-2 flex w-48 flex-col gap-4 rounded-3xl bg-[var(--ollo-teal-900)] p-5 text-white"
          >
            {links.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
            <Link href="/sign-in" className="font-bold">
              {nav.logIn}
            </Link>
          </nav>
        </details>
      </div>
    </>
  );
}

/** The back layer (the "Parallax back" shape): the slowest layer. */
function Back({ parallax, children }: { parallax: boolean; children: ReactNode }) {
  return parallax ? (
    <ParallaxLayer scroll={0.05} className="absolute inset-0">
      {children}
    </ParallaxLayer>
  ) : (
    <div className="absolute inset-0">{children}</div>
  );
}

/**
 * The hero: dark page, a gradient shape with the design's notches. `home` is the tall hero with the
 * "See how it works" notch at the bottom, `inner` the short one used on the other pages.
 */
export function HeroFrame({
  nav,
  variant,
  children,
  bottomLink,
}: {
  nav: LandingCopy["nav"];
  variant: "home" | "inner";
  children: ReactNode;
  bottomLink?: string;
}) {
  const home = variant === "home";
  return (
    <section className={`${TEAL} p-3 md:p-6`}>
      <div
        className={`relative overflow-hidden rounded-[28px] md:overflow-visible md:rounded-none ${home ? "min-h-[820px] md:h-[900px]" : "min-h-[320px] md:h-[380px]"}`}
      >
        <Back parallax={home}>
          {/* Phone: the plain gradient. It reaches above the hero so it can slide without a gap. */}
          <div className={`absolute inset-x-0 -top-16 bottom-0 md:hidden ${MINT_GRADIENT}`} />
          <svg
            aria-hidden="true"
            viewBox={`0 0 1392 ${home ? 900 : 380}`}
            preserveAspectRatio="none"
            className="absolute inset-0 hidden size-full md:block"
          >
            <defs>
              <linearGradient
                id={`hero-fill-${variant}`}
                gradientUnits="userSpaceOnUse"
                x1="455.191"
                y1={home ? -109.582 : -46.2678}
                x2={home ? 673.058 : 495.862}
                y2={home ? 795.417 : 353.854}
              >
                <stop stopColor="#00C781" />
                <stop offset="1" stopColor="#D3F6E7" />
              </linearGradient>
            </defs>
            <path d={home ? HOME_SHAPE : INNER_SHAPE} fill={`url(#hero-fill-${variant})`} />
          </svg>
        </Back>
        <HeroHeader nav={nav} />
        {children}
        {home && bottomLink ? (
          <a
            href={bottomLink}
            className="absolute bottom-0 left-[30.2%] z-10 hidden h-20 w-[39.7%] items-center justify-center gap-2 text-white md:flex"
          >
            See how it works
            <ChevronDown className="size-6" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </section>
  );
}

/** Join band at the bottom of every public page. */
export function JoinBand({ join }: { join: LandingCopy["join"] }) {
  return (
    <section id="join" className={`${TEAL} px-3 pt-3 pb-6 md:px-6 md:pt-6`}>
      <div
        className={`flex flex-col gap-6 rounded-[32px] p-8 md:rounded-[40px] md:p-20 ${MINT_GRADIENT}`}
      >
        <h2 className="text-4xl leading-tight font-bold md:text-[56px]">{join.title}</h2>
        <p className="text-xl">{join.body}</p>
        <Link href="/sign-in" className={`${PILL} ${TEAL} self-start text-white`}>
          {join.button}
        </Link>
      </div>
    </section>
  );
}

const FOOTER_LINKS: Record<string, string> = {
  "How it works": "/#how-it-works",
  Pricing: "/pricing",
  "Help centre": "/help",
  About: "/about",
  Contact: "/contact",
  "Terms of service": "/terms",
  "Privacy policy": "/privacy",
};

export function SiteFooter({ footer }: { footer: LandingCopy["footer"] }) {
  const column = (title: string, items: string[]) => (
    <div className="flex flex-col gap-3">
      <p className="font-bold text-white">{title}</p>
      {items.map((item) => (
        <Link key={item} href={FOOTER_LINKS[item] ?? "/"} className="text-[#d3f6e7]">
          {item}
        </Link>
      ))}
    </div>
  );
  return (
    <footer className={`${TEAL} px-6 py-16 md:px-16`}>
      <div className="mx-auto flex max-w-[1120px] flex-col gap-8">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="flex max-w-[360px] flex-col gap-4">
            <Wordmark className="text-[40px]" />
            <p className="text-[#d3f6e7]">{footer.tagline}</p>
          </div>
          <div className="flex flex-wrap gap-16">
            {column("Product", footer.product)}
            {column("Company", footer.company)}
            {column("Legal", footer.legal)}
          </div>
        </div>
        <p className="text-[#d3f6e7]">{footer.legalLine}</p>
      </div>
    </footer>
  );
}
