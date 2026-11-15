import { FEE_RATES_BPS } from "@/lib/fees/config";
import { PLAN_OPTIONS } from "@/lib/sellers/options";

/**
 * The words on the public pages other than the landing page, taken from the Figma frames
 * (Hi-fi: Pricing and fees, About our story, FAQ and help centre, Contact and support, Terms of
 * service, Privacy policy). Strings that still need the owner's wording are listed in the hand-over
 * notes and are left out here, not invented.
 */
const pct = (bps: number) => `${bps / 100}%`;
const rate = (plan: "free" | "pro", cls: "bank" | "card") => pct(FEE_RATES_BPS[plan][cls]);

export const SUPPORT_EMAIL = "hello@ollopay.co.za";

export const PRICING = {
  hero: {
    title: "Simple fees, no surprises",
    body: "Making a pay link is free. Pro is R149 a month with lower fees. We show every fee before payments go live.",
  },
  plans: [
    {
      label: "Free plan",
      name: "Start selling",
      price: "Free",
      lines: [
        `${rate("free", "bank")} per bank payment`,
        `${rate("free", "card")} per card payment`,
        "Powered by Ollo on your pay page",
      ],
      button: "Make your pay link",
    },
    {
      label: "Pro plan",
      name: "Grow with Ollo Pro",
      price: PLAN_OPTIONS.find((p) => p.value === "pro")!.price,
      lines: [
        `${rate("pro", "bank")} per bank payment`,
        "Custom domain and no Ollo branding",
        "More Pro features coming soon",
      ],
      button: "Go Pro",
    },
  ],
  table: {
    title: "What you pay",
    head: ["What", "Cost"],
    rows: [
      { name: "Pay link and pay page", value: "Free", strong: true },
      { name: "Payment requests", value: "Free", strong: true },
      {
        name: "Payments (Free plan)",
        value: `${rate("free", "bank")} bank, ${rate("free", "card")} card. Pro: ${rate("pro", "bank")} bank`,
        strong: false,
      },
      {
        name: "Payouts to your bank",
        value: "Straight to your bank account. Timing depends on how your customer pays.",
        strong: false,
      },
    ],
  },
};

export const ABOUT = {
  hero: {
    title: "Built for people who sell from their phones",
    body: "Ollo is a payments platform for independent businesses in South Africa.",
  },
  photoLabel: "Founders photo",
  story: {
    title: "Our story",
    lead: "Many South Africans run real businesses from Instagram, WhatsApp and TikTok. Taking payments there is slow, manual and risky.",
    body: "Ollo gives them a pay link and safe payments, so they get paid in seconds without a website or a card machine.",
  },
  beliefsTitle: "What we believe",
  beliefs: [
    {
      title: "Made for sellers",
      body: "Every feature starts with a real seller and the way they work today.",
    },
    { title: "Simple by default", body: "If it takes more than a few taps, we rebuild it." },
    {
      title: "Safe for buyers",
      body: "Clear pay pages and trusted payments so customers feel confident.",
    },
  ],
};

export interface HelpQuestion {
  question: string;
  answer: string;
  /** Shown instead of `answer` when PAYMENTS_LIVE is on. */
  liveAnswer?: string;
}

export function helpAnswer(item: HelpQuestion, live: boolean): string {
  return live && item.liveAnswer ? item.liveAnswer : item.answer;
}

export const HELP = {
  hero: { title: "How can we help?" },
  searchLabel: "Search for answers",
  tabs: ["All", "Getting started", "Selling", "Payments", "Account"],
  questions: [
    {
      question: "What is Ollo?",
      answer:
        "Ollo gives you a pay link, so customers can pay you in seconds without installing an app.",
    },
    {
      question: "Do I need a website?",
      answer:
        "No. Your pay link opens your pay page, where customers see your name and pay you. There is nothing to build.",
    },
    {
      question: "How much does it cost?",
      answer:
        "Making a pay link is free. On the free plan, bank payments cost 3% and card payments 3.9%. Pro is R149 a month with 2.5% on bank payments. The smallest fee on any payment is R1.",
    },
    {
      question: "How do customers pay today?",
      answer:
        "Customers open your pay link and pay from their banking app or by card. You choose which payment methods to switch on.",
    },
    {
      question: "When will payments start?",
      answer:
        "Payments are launching in January. Until then you can set up your pay page. Once payments are live, the money goes to your bank account.",
      liveAnswer:
        "Payments are live. Once your account is verified, customers can pay you through your pay link and the money goes to your bank account.",
    },
    {
      question: "Is my information safe?",
      answer:
        "Your ID number and bank details are stored encrypted, and we use them only to verify you and pay you. Payments are handled by our payment partner, so Ollo never sees or stores your customers' card or banking login details.",
    },
  ] as HelpQuestion[],
  stillNeedHelp: {
    title: "Still need help?",
    body: "Send us a message and we will get back to you.",
    button: "Contact support",
  },
};

export const CONTACT = {
  hero: { title: "Talk to us", body: "We are here to help you set up and sell." },
  form: {
    title: "Send us a message",
    name: { label: "Your name", placeholder: "e.g. Thandi Ndlovu" },
    email: { label: "Email address", placeholder: "e.g. thandi@email.com" },
    phone: { label: "Cellphone number", optional: "(optional)", placeholder: "e.g. 82 456 7890" },
    roleLabel: "I am a",
    roles: ["Seller", "Buyer", "Something else"],
    message: { label: "Message", placeholder: "Tell us how we can help" },
    button: "Send message",
  },
  otherWays: {
    title: "Other ways to reach us",
    email: { title: "Email us", value: SUPPORT_EMAIL },
  },
};

export interface LegalPage {
  title: string;
  updated: string;
  sections: string[];
}

export const LEGAL_NOTICE = {
  title: "Draft layout",
  body: "The legal wording must come from your legal adviser before launch.",
};
export const LEGAL_PLACEHOLDER = "Placeholder text, to be written by a lawyer.";

export const TERMS: LegalPage = {
  title: "Terms of service",
  updated: "Last updated: date to be confirmed",
  sections: [
    "About Ollo and these terms",
    "Your account",
    "Selling on Ollo",
    "Payments",
    "Fees",
    "Refunds and disputes",
    "Suspending an account",
    "Changes to these terms",
    "Contact us",
  ],
};

export const PRIVACY: LegalPage = {
  title: "Privacy policy",
  updated: "Last updated: date to be confirmed",
  sections: [
    "What information we collect",
    "Why we collect it",
    "Who we share it with",
    "How long we keep it",
    "How we keep it safe",
    "Your rights under POPIA",
    "Contact our Information Officer",
  ],
};
