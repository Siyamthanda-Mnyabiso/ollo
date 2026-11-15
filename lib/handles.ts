import { z } from "zod";

/** Pay pages live at /[handle], so a handle must never clash with a real route. */
export const RESERVED_HANDLES = [
  "admin",
  "api",
  "auth",
  "dashboard",
  "onboarding",
  "sign-in",
  "sign-up",
  "login",
  "logout",
  "pricing",
  "about",
  "faq",
  "help",
  "contact",
  "terms",
  "privacy",
  "support",
  "settings",
  "billing",
  "payouts",
  "orders",
  "ollo",
  "ollopay",
  "www",
  "app",
  "pay",
  "_next",
  "static",
] as const;

export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9][a-z0-9-]{1,29}$/,
    "Use 2 to 30 letters, numbers or hyphens, starting with a letter or number",
  )
  .refine((h) => !(RESERVED_HANDLES as readonly string[]).includes(h), "That address is reserved");
