/**
 * The words on the public pages, from the Figma landing page (Hi-fi, "Landing page"), in two
 * versions chosen by the PAYMENTS_LIVE flag. Only the sentences the owner approved differ from the
 * design. Rules: say "pay link" and "pay page", never "shop" or "store", and never say "instantly".
 */
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
  join: { title: string; body: string; button: string };
  footer: {
    tagline: string;
    product: string[];
    company: string[];
    legal: string[];
    legalLine: string;
  };
}

const PAYOUTS_LINE = {
  live: "Payouts go straight to your bank account.",
  prelaunch: "Payouts go straight to your bank account. From January.",
};

const PAID_STATUS = "Paid in seconds with pay by bank";

const shared = (live: boolean) => ({
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
        title: "Customers pay",
        body: "Customers tap your link, pay from their banking app, and the money goes to your bank account.",
      },
      { title: "Money in your bank", body: PAYOUTS_LINE[live ? "live" : "prelaunch"] },
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
        body: "See every payment and customer without scrolling through chats.",
      },
      { number: "04", title: "Get paid faster", body: PAYOUTS_LINE[live ? "live" : "prelaunch"] },
    ],
  },
  footer: {
    tagline: "Payments for independent businesses.",
    product: ["How it works", "Pricing", "Help centre"],
    company: ["About", "Contact"],
    legal: ["Terms of service", "Privacy policy"],
    legalLine: "Made in South Africa. 2026 Ollo",
  },
});

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
  ...shared(true),
  hero: { ...hero, label: null, primaryButton: "Get your pay link" },
  join: {
    title: "Start getting paid today",
    body: "Set up your pay link in minutes and share it anywhere you sell.",
    button: "Get your pay link",
  },
};

export const COPY_PRELAUNCH: LandingCopy = {
  ...shared(false),
  hero: {
    ...hero,
    label: `Launching ${LAUNCH_MONTH}`,
    primaryButton: "Join as a founding seller",
  },
  join: {
    title: "Join as a founding seller",
    body: "Payments are coming soon. Set up your pay page now and be first in line.",
    button: "Create your free pay page",
  },
};

export const getCopy = (live: boolean): LandingCopy => (live ? COPY_LIVE : COPY_PRELAUNCH);
