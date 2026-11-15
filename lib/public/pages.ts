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
      name: "Start selling",
      price: "Free",
      lines: [
        `${rate("free", "bank")} per bank sale`,
        `${rate("free", "card")} per card sale`,
        "Powered by Ollo on your pay page",
      ],
      button: "Make your pay link",
    },
    {
      name: "Grow with Ollo Pro",
      price: PLAN_OPTIONS.find((p) => p.value === "pro")!.price,
      lines: [`${rate("pro", "bank")} per bank sale`, "Custom domain and no Ollo branding"],
      button: "Go Pro",
    },
  ],
  table: {
    title: "What you pay",
    rows: [
      ["Pay link and pay page", "Free"],
      [
        "Payments",
        `Free plan: ${rate("free", "bank")} bank, ${rate("free", "card")} card. Pro: ${rate("pro", "bank")} bank`,
      ],
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
    lead: "Many South Africans run real businesses from Instagram, WhatsApp and TikTok. Taking orders and payments there is slow, manual and risky.",
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
      body: "Clear orders and trusted payments so customers feel confident.",
    },
  ],
};

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
    { question: "Do I need a website?", answer: null },
    { question: "How much does it cost?", answer: null },
    { question: "How do customers order today?", answer: null },
    { question: "When will payments start?", answer: null },
    { question: "Is my information safe?", answer: null },
  ],
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
    whatsapp: { title: "Chat on WhatsApp", value: "+27 82 456 7890" },
    email: { title: "Email us", value: SUPPORT_EMAIL },
    hours: { title: "Support hours", value: "To be confirmed" },
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
export const LEGAL_PLACEHOLDER = "Placeholder. This text is to be written by a lawyer.";

export const TERMS: LegalPage = {
  title: "Terms of service",
  updated: "Last updated: date to be confirmed",
  sections: [
    "About Ollo and these terms",
    "Your account",
    "Selling on Ollo",
    "Orders and payments",
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
