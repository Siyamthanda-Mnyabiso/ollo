import { FEE_RATES_BPS, MINIMUM_FEE_CENTS } from "@/lib/fees/config";
import { PLAN_OPTIONS } from "@/lib/sellers/options";

/**
 * All words on the public pages, in two versions chosen by the PAYMENTS_LIVE flag.
 * Rules: Ollo is for getting paid in seconds, not a store builder. Say "pay link" and "pay page",
 * never "shop" or "store". Instant payouts are promised for bank payments only, never for cards.
 */
const pct = (bps: number) => `${bps / 100}%`;
const rate = (plan: "free" | "pro", cls: "bank" | "card") => pct(FEE_RATES_BPS[plan][cls]);

export const LAUNCH_MONTH = "January";

export interface PublicCopy {
  hero: { title: string; body: string };
  steps: { title: string; body: string }[];
  methods: { title: string; body: string };
  payouts: { title: string; body: string };
  pricing: {
    title: string;
    intro: string;
    plans: { name: string; price: string; lines: string[] }[];
    minimumFee: string;
  };
  cta: { title: string; body: string };
}

const pricing = (intro: string): PublicCopy["pricing"] => ({
  title: "Pricing",
  intro,
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

export const COPY_LIVE: PublicCopy = {
  hero: {
    title: "Get paid in seconds",
    body: "Send customers a pay link. They pay by PayShap, Capitec Pay, Instant EFT or card, and you see it straight away. No website and no card machine.",
  },
  steps: [
    {
      title: "Make your pay link",
      body: "Sign up with your cellphone number and pick your link, like ollopay.co.za/yourname.",
    },
    {
      title: "Send it to a customer",
      body: "Share your pay link or a payment request on WhatsApp, Instagram or in person.",
    },
    {
      title: "Get paid",
      body: "Your customer pays on your pay page. You see the payment in your dashboard.",
    },
  ],
  methods: {
    title: "Four ways for customers to pay",
    body: "PayShap, Capitec Pay, Instant EFT and card. You choose which ones to switch on.",
  },
  payouts: {
    title: "Instant payouts for bank payments",
    body: "Money from PayShap, Capitec Pay and Instant EFT payments goes to your bank account straight away. Card payments are not paid out instantly.",
  },
  pricing: pricing("Start free. Pay only when you get paid."),
  cta: {
    title: "Make your pay link",
    body: "It takes a few minutes. You will need your ID and your bank account details.",
  },
};

export const COPY_PRELAUNCH: PublicCopy = {
  hero: {
    title: `Launching ${LAUNCH_MONTH}`,
    body: "Ollo is a way to get paid in seconds. Send customers a pay link and they pay by PayShap, Capitec Pay, Instant EFT or card. Leave your number and we will message you when it opens.",
  },
  steps: COPY_LIVE.steps.map((s) => ({ ...s })),
  methods: {
    title: "Four ways for customers to pay",
    body: "At launch, customers will be able to pay by PayShap, Capitec Pay, Instant EFT or card.",
  },
  payouts: {
    title: "Instant payouts for bank payments",
    body: "At launch, money from bank payments will go to your bank account straight away. Card payments will not be paid out instantly.",
  },
  pricing: pricing("These are the prices at launch."),
  cta: {
    title: "Be first to know",
    body: `Leave your number and we will message you when Ollo opens in ${LAUNCH_MONTH}.`,
  },
};

export const getCopy = (live: boolean): PublicCopy => (live ? COPY_LIVE : COPY_PRELAUNCH);
