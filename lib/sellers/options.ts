/** Choices shown during onboarding. Values are stored; labels are shown. */
export const CATEGORIES = [
  "Hair and beauty",
  "Fashion and clothing",
  "Food and baking",
  "Gifts and crafts",
  "Something else",
] as const;

export const CHANNELS = ["Instagram", "WhatsApp", "TikTok", "Facebook", "In person"] as const;

export const SALES_RANGES = [
  { value: "under_5k", label: "Under R5k" },
  { value: "5k_20k", label: "R5k to R20k" },
  { value: "20k_50k", label: "R20k to R50k" },
  { value: "over_50k", label: "Over R50k" },
] as const;

export const CURRENT_PAYMENT_METHODS = [
  "EFT or bank transfer",
  "Cash",
  "Card machine",
  "Payment apps",
] as const;

export const ONBOARDING_STEPS = [
  { slug: "profile", title: "About you" },
  { slug: "business", title: "About your business" },
  { slug: "link", title: "Your pay link" },
  { slug: "verify", title: "Verify your identity" },
  { slug: "bank", title: "Bank account" },
  { slug: "plan", title: "Choose a plan" },
] as const;
