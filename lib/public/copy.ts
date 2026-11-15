import { FEE_RATES_BPS, MINIMUM_FEE_CENTS } from "@/lib/fees/config";
import { PLAN_OPTIONS } from "@/lib/sellers/options";

/**
 * The words on the public pages, from the Figma landing page (Hi-fi, "Landing page"), in two
 * versions chosen by the PAYMENTS_LIVE flag. Only the sentences the owner approved differ from the
 * design. Rules: say "pay link" and "pay page", never "shop" or "store", and never say "instantly".
 */
const pct = (bps: number) => `${bps / 100}%`;
const rate = (plan: "free" | "pro", cls: "bank" | "card") => pct(FEE_RATES_BPS[plan][cls]);

export const LAUNCH_MONTH = "January";

export interface LandingCopy {
  nav: { howItWorks: string; pricing: string; about: string; helpCentre: string; logIn: string };
  hero: {
    /** Shown only before launch. */
    label: string | null;
    title: string;
    body: string;
    primaryButton: string;
    secondaryButton: string;
    note: string;
    payoutCard: { amount: string; status: string; bank: string };
    shareLabel: string;
    scrollLabel: string;
  };
  strip: { title: string; inPerson: string };
  how: { title: string; steps: { title: string; body: string }[]; payoutCard: { label: string } };
  features: { title: string; items: { number: string; title: string; body: string }[] };
  join: { title: string; body: string | null; button: string };
  footer: {
    tagline: string;
    product: string[];
    company: string[];
    legal: string[];
    legalLine: string;
  };
}

const PAID_STATUS = "Paid in seconds with pay by bank";

const shared = {
  nav: {
    howItWorks: "How it works",
    pricing: "Pricing",
    about: "About",
    helpCentre: "Help centre",
    logIn: "Log in",
  },
  strip: { title: "Sell wherever your customers are", inPerson: "In person" },
  how: {
    title: "How Ollo works",
    payoutCard: { label: "Next payout" },
    steps: [
      { title: "Set up your pay page", body: "Pick your link, add your business name and logo." },
      { title: "Share your link", body: "Put it in your Instagram bio or send it on WhatsApp." },
      {
        title: "Get paid",
        body: "Customers tap your link, pay from their banking app, and the money goes to your bank account.",
      },
      { title: "Then get paid", body: "Payouts go straight to your bank. Coming soon." },
    ],
  },
  features: {
    title: "Everything you need to get paid",
    items: [
      {
        number: "01",
        title: "One link for every platform",
        body: "Share the same pay link on Instagram, WhatsApp and TikTok.",
      },
      {
        number: "02",
        title: "A simple checkout",
        body: "Customers pay in a few taps, with no account and no app.",
      },
      {
        number: "03",
        title: "Payments in one place",
        body: "See every order request and customer without scrolling chats.",
      },
      {
        number: "04",
        title: "Get paid faster",
        body: "Payouts straight to your bank. Coming soon.",
      },
    ],
  },
  footer: {
    tagline: "Payments for independent businesses.",
    product: ["How it works", "Pricing", "Help centre"],
    company: ["About", "Contact"],
    legal: ["Terms of service", "Privacy policy"],
    legalLine: "Made in South Africa. 2026 Ollo",
  },
};

const hero = {
  title: "Get paid for what you sell online",
  body: "A pay link, a simple checkout and one place to see every payment.",
  secondaryButton: "See how it works",
  note: "Built for sellers on Instagram, WhatsApp and TikTok.",
  payoutCard: { amount: "R4,200.00", status: PAID_STATUS, bank: "Bank account ending 7890" },
  shareLabel: "Share your pay link on",
  scrollLabel: "See how it works",
};

export const COPY_LIVE: LandingCopy = {
  ...shared,
  hero: { ...hero, label: null, primaryButton: "Get your pay link" },
  join: { title: "Start getting paid today", body: null, button: "Get your pay link" },
};

export const COPY_PRELAUNCH: LandingCopy = {
  ...shared,
  hero: {
    ...hero,
    label: `Launching ${LAUNCH_MONTH}`,
    primaryButton: "Join as a founding seller",
  },
  join: {
    title: "Join as a founding seller",
    body: "Payments are coming soon. Set up your pay page now and be first in line.",
    button: "Join as a founding seller",
  },
};

export const getCopy = (live: boolean): LandingCopy => (live ? COPY_LIVE : COPY_PRELAUNCH);

// ---- the pricing page --------------------------------------------------------------------------

export interface PricingCopy {
  title: string;
  intro: string;
  plans: { name: string; price: string; lines: string[] }[];
  minimumFee: string;
}

export const getPricingCopy = (live: boolean): PricingCopy => ({
  title: "Pricing",
  intro: live ? "Start free. Pay only when you get paid." : "These are the prices at launch.",
  plans: PLAN_OPTIONS.map((p) => ({
    name: p.name,
    price: p.price,
    lines: [
      `${rate(p.value, "bank")} on each bank payment`,
      `${rate(p.value, "card")} on each card payment`,
      p.value === "free"
        ? "Ollo branding on your pay page"
        : "Your own domain and no Ollo branding",
    ],
  })),
  minimumFee: `The smallest fee on any payment is R${MINIMUM_FEE_CENTS / 100}.`,
});
