import Link from "next/link";
import { Clock, Landmark } from "lucide-react";
import type { ReactNode } from "react";
import { DotMap } from "@/components/public/dot-map";
import {
  ChatIcon,
  FacebookLogo,
  InstagramIcon,
  InstagramLogo,
  ShareIcon,
  TikTokLogo,
  WhatsAppLogo,
} from "@/components/public/platform-logos";
import { ParallaxLayer } from "@/components/public/parallax";
import { PayoutsScreen, ShareScreen } from "@/components/public/phone-screens";
import {
  HeroFrame,
  JoinBand,
  MINT_GRADIENT,
  PILL,
  SiteFooter,
  TEAL,
} from "@/components/public/site";
import { getCopy, type LandingCopy } from "@/lib/public/copy";

/*
 * Built from the Figma "Landing page" (Hi-fi). Layout, sections and colours follow the design.
 * The phone mockups are images in the design: until the owner decides what goes in each slot they
 * are drawn as empty phone frames (see PhoneSlot).
 */
/** An empty phone frame: the design's phone chrome with no screen in it yet. */
function PhoneSlot({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-[32px] border-8 border-[var(--ollo-teal-900)] bg-[var(--ollo-surface)] ${className}`}
    />
  );
}

function PayoutCard({ copy, size }: { copy: LandingCopy; size: "hero" | "step" }) {
  const card = copy.hero.payoutCard;
  return (
    <div
      className={`${TEAL} flex flex-col gap-3 text-white ${size === "hero" ? "rounded-[32px] p-7" : "rounded-3xl p-6"}`}
    >
      {size === "step" ? <p className="text-[#d3f6e7]">{copy.how.payoutCard.label}</p> : null}
      <p className="text-[40px] leading-[48px] font-bold">{card.amount}</p>
      <p className="flex items-center gap-2 font-bold">
        {size === "step" ? <Clock className="size-6" aria-hidden="true" /> : null}
        {card.status}
      </p>
      <hr className="border-[#0a5a56]" />
      <p className="flex items-center gap-2 text-[#d3f6e7]">
        {size === "step" ? <Landmark className="size-6" aria-hidden="true" /> : null}
        {card.bank}
      </p>
    </div>
  );
}

function Hero({ copy }: { copy: LandingCopy }) {
  const { hero } = copy;
  return (
    <HeroFrame nav={copy.nav} variant="home" bottomLink="#how-it-works">
      <ParallaxLayer
        scroll={0.02}

        className="absolute top-[38%] left-[46%] hidden w-[44%] md:block"
      >
        <DotMap className="w-full" />
      </ParallaxLayer>
      <div className="relative grid gap-12 px-6 pt-28 pb-56 md:grid-cols-[640px_1fr] md:gap-[112px] md:px-[88px] md:pt-[170px] md:pb-0">
        <ParallaxLayer scroll={-0.03} className="flex flex-col gap-6">
          {hero.label ? <p className="font-bold">{hero.label}</p> : null}
          <h1 className="max-w-[640px] text-5xl leading-[1.07] font-bold tracking-tight md:text-[56px]">
            {hero.title}
          </h1>
          <p className="max-w-[640px] text-xl">{hero.body}</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/sign-in" className={`${PILL} ${TEAL} text-white`}>
              {hero.primaryButton}
            </Link>
            <a
              href="#how-it-works"
              className={`${PILL} h-14 border-2 border-[var(--ollo-teal-900)] px-6 text-[var(--ollo-teal-900)]`}
            >
              {hero.secondaryButton}
            </a>
          </div>
          <p>{hero.note}</p>
        </ParallaxLayer>
        <ParallaxLayer scroll={-0.05} className="md:max-w-[400px] md:pt-16">
          <PayoutCard copy={copy} size="hero" />
        </ParallaxLayer>
      </div>
      <div className="absolute inset-x-0 bottom-20 flex flex-col items-center gap-3 px-4">
        <p className="font-bold">{hero.shareLabel}</p>
        <div className="flex flex-wrap justify-center gap-3 font-bold text-[var(--ollo-teal-900)]">
          {[
            { label: "Instagram", icon: <InstagramIcon className="size-6" /> },
            { label: "WhatsApp", icon: <ChatIcon className="size-6" /> },
            { label: "TikTok", icon: <ShareIcon className="size-6" /> },
          ].map((p) => (
            <span
              key={p.label}
              className="flex h-12 items-center gap-2 rounded-xl border-2 border-[var(--ollo-teal-900)] px-5"
            >
              {p.icon}
              {p.label}
            </span>
          ))}
        </div>
      </div>
    </HeroFrame>
  );
}

function Strip({ copy }: { copy: LandingCopy }) {
  return (
    <section className={`${TEAL} flex flex-col items-center gap-4 px-6 pt-2 pb-14`}>
      <p className="font-bold text-white">{copy.strip.title}</p>
      <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-4 text-[#d3f6e7]">
        <InstagramLogo className="size-8" />
        <WhatsAppLogo className="size-8" />
        <TikTokLogo className="h-8 w-7" />
        <FacebookLogo className="size-8" />
        <span className="text-2xl font-bold">{copy.strip.inPerson}</span>
      </div>
    </section>
  );
}

function BentoCard({
  className,
  title,
  body,
  tone,
  children,
  badge,
  textWidth = 360,
}: {
  textWidth?: number;
  className: string;
  title: string;
  body: string;
  tone: "white" | "dark" | "tint" | "gradient";
  children?: ReactNode;
  badge?: ReactNode;
}) {
  const surface = {
    white: "bg-white",
    dark: `${TEAL} text-white`,
    tint: "bg-[var(--ollo-mint-50)]",
    gradient: MINT_GRADIENT,
  }[tone];
  const bodyColour =
    tone === "dark" ? "text-[#d3f6e7]" : tone === "gradient" ? "" : "text-[var(--ollo-ink-500)]";
  return (
    <div className={`relative overflow-hidden rounded-[32px] p-8 ${surface} ${className}`}>
      <div className="relative z-10 flex flex-col gap-3" style={{ maxWidth: textWidth }}>
        {badge}
        <h3 className="text-[28px] leading-[35px] font-bold">{title}</h3>
        <p className={bodyColour}>{body}</p>
      </div>
      {children}
    </div>
  );
}

function How({ copy }: { copy: LandingCopy }) {
  const [one, two, three, four] = copy.how.steps;
  return (
    <section
      id="how-it-works"
      className="mx-auto w-full max-w-[1248px] scroll-mt-4 px-4 py-16 md:px-16 md:py-24"
    >
      <h2 className="mb-12 text-[40px] leading-[48px] font-bold">{copy.how.title}</h2>
      <div className="grid gap-6 md:grid-cols-[672fr_424fr]">
        <BentoCard
          className="min-h-[380px]"
          tone="white"
          textWidth={240}
          title={one!.title}
          body={one!.body}
        >
          <PhoneSlot className="mx-auto mt-8 h-56 w-[296px] max-w-full md:absolute md:top-8 md:right-14 md:mt-0 md:h-[400px]" />
        </BentoCard>
        <BentoCard className="min-h-[380px]" tone="dark" title={two!.title} body={two!.body}>
          <ShareScreen className="mx-auto mt-8 h-72 w-[296px] max-w-full md:absolute md:top-[151px] md:left-1/2 md:mt-0 md:h-[378px] md:-translate-x-1/2" />
        </BentoCard>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-[424fr_672fr]">
        <BentoCard className="min-h-[424px]" tone="tint" title={three!.title} body={three!.body}>
          <PhoneSlot className="mx-auto mt-8 h-56 w-[296px] max-w-full md:absolute md:top-[151px] md:left-1/2 md:mt-0 md:h-[360px] md:-translate-x-1/2" />
        </BentoCard>
        <BentoCard
          className="min-h-[424px]"
          tone="gradient"
          textWidth={240}
          title={four!.title}
          body={four!.body}
        >
          <div className="mt-8 md:absolute md:top-8 md:right-8 md:mt-0 md:w-[344px]">
            <PayoutCard copy={copy} size="step" />
          </div>
        </BentoCard>
      </div>
    </section>
  );
}

function Features({ copy }: { copy: LandingCopy }) {
  const [one, two, three, four] = copy.features.items;
  const badge = (n: string, dark = false) => (
    <span
      className={`flex size-10 items-center justify-center rounded-full font-bold ${dark ? `${TEAL} text-white` : "bg-[var(--ollo-mint-500)] text-[var(--ollo-teal-900)]"}`}
    >
      {n}
    </span>
  );
  return (
    <section className="mx-auto w-full max-w-[1248px] px-4 pb-16 md:px-16 md:pb-24">
      <h2 className="mb-12 text-[40px] leading-[48px] font-bold">{copy.features.title}</h2>
      <div className="grid gap-6 md:grid-cols-[424fr_672fr]">
        <BentoCard
          className="min-h-[540px]"
          tone="dark"
          badge={badge(one!.number)}
          title={one!.title}
          body={one!.body}
        >
          <PhoneSlot className="mx-auto mt-8 h-64 w-[296px] max-w-full md:absolute md:top-[203px] md:left-1/2 md:mt-0 md:h-[520px] md:-translate-x-1/2" />
        </BentoCard>
        <BentoCard
          className="min-h-[540px]"
          tone="white"
          badge={badge(two!.number)}
          textWidth={608}
          title={two!.title}
          body={two!.body}
        >
          <PhoneSlot className="mx-auto mt-8 h-64 w-[296px] max-w-full md:absolute md:top-[179px] md:left-1/2 md:mt-0 md:h-[520px] md:-translate-x-1/2" />
        </BentoCard>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-[672fr_424fr]">
        <BentoCard
          className="min-h-[540px]"
          tone="tint"
          badge={badge(three!.number)}
          textWidth={608}
          title={three!.title}
          body={three!.body}
        >
          <div
            aria-hidden="true"
            className="mt-8 h-64 rounded-3xl bg-white md:absolute md:inset-x-8 md:top-[179px] md:mt-0 md:h-[321px]"
          />
        </BentoCard>
        <BentoCard
          className="min-h-[540px]"
          tone="gradient"
          badge={badge(four!.number, true)}
          title={four!.title}
          body={four!.body}
        >
          <PayoutsScreen className="mx-auto mt-8 h-[420px] w-[296px] max-w-full md:absolute md:top-[179px] md:left-1/2 md:mt-0 md:h-[400px] md:-translate-x-1/2" />
        </BentoCard>
      </div>
    </section>
  );
}

/** The landing page. `live` comes from the PAYMENTS_LIVE flag. */
export function Landing({ live }: { live: boolean }) {
  const copy = getCopy(live);
  return (
    <div className={`${TEAL} text-[var(--ollo-ink-900)]`}>
      <main>
        <Hero copy={copy} />
        <Strip copy={copy} />
        <div className="bg-[var(--ollo-surface)]">
          <How copy={copy} />
          <Features copy={copy} />
        </div>
        <JoinBand join={copy.join} />
      </main>
      <SiteFooter footer={copy.footer} />
    </div>
  );
}
