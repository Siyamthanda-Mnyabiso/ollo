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
  faq: { question: string; answer: string }[];
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

const faq = (live: boolean): PublicCopy["faq"] => [
  {
    question: "Do I need a website?",
    answer:
      "No. Your pay link opens your pay page, where customers see your name and pay you. There is nothing to build.",
  },
  {
    question: "Do I need a card machine?",
    answer: "No. Customers pay on their own phone, so you do not need to buy or rent a machine.",
  },
  {
    question: "Do I need a registered business?",
    answer:
      "No. You sign up with your ID and a bank account in your own name, and you can add a business later.",
  },
  {
    question: live ? "How fast do I get paid?" : "How fast will I get paid?",
    answer: live
      ? "Money from PayShap, Capitec Pay and Instant EFT payments goes to your bank account straight away. Card payments are not paid out instantly."
      : "At launch, money from bank payments will go to your bank account straight away. Card payments will not be paid out instantly.",
  },
  {
    question: live ? "What does it cost?" : "What will it cost?",
    answer: `${rate("free", "bank")} on each bank payment and ${rate("free", "card")} on each card payment on the free plan, with no monthly fee. The smallest fee on any payment is R${MINIMUM_FEE_CENTS / 100}.`,
  },
  {
    question: "Can I refund a customer?",
    answer: "Yes. You can refund a whole payment from your payments list.",
  },
];

export const COPY_LIVE: PublicCopy = {
  hero: {
    title: "Get paid in seconds",
    body: "Send a pay link or a payment request on WhatsApp. Your customer pays by PayShap, Capitec Pay, Instant EFT or card, and the money lands in your bank account. No website, no card machine and no business registration.",
  },
  steps: [
    {
      title: "Make your pay link",
      body: "Sign up with your cellphone number and pick your link, like ollopay.co.za/yourname.",
    },
    {
      title: "Share it or request a payment",
      body: "Send your pay link, or a payment request for an exact amount, on WhatsApp, Instagram or in person.",
    },
    {
      title: "Money lands in your bank account",
      body: "Your customer pays on your pay page. You see the payment in your dashboard and the money goes to your bank account.",
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
  faq: faq(true),
  cta: {
    title: "Make your pay link",
    body: "It takes a few minutes. You will need your ID and your bank account details.",
  },
};

export const COPY_PRELAUNCH: PublicCopy = {
  hero: {
    title: `Launching ${LAUNCH_MONTH}`,
    body: "Ollo is how you will get paid in seconds, with no website, no card machine and no business registration. Send a pay link and customers pay by PayShap, Capitec Pay, Instant EFT or card. Leave your number and we will message you when it opens.",
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
  faq: faq(false),
  cta: {
    title: "Be first to know",
    body: `Leave your number and we will message you when Ollo opens in ${LAUNCH_MONTH}.`,
  },
};

export const getCopy = (live: boolean): PublicCopy => (live ? COPY_LIVE : COPY_PRELAUNCH);
