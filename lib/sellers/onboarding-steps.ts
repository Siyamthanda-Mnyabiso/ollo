export type OnboardingPath =
  | "/onboarding/profile"
  | "/onboarding/business"
  | "/onboarding/link"
  | "/onboarding/verify"
  | "/onboarding/bank"
  | "/onboarding/plan"
  | "/dashboard";

interface OnboardingProgress {
  seller: { onboardedAt: Date | null } | null;
  hasSurvey?: boolean;
  verification: { idStatus: string; bankStatus: string } | null;
}

/** The first step the seller has not finished. Used to resume part-way and to gate later steps. */
export function nextOnboardingPath(p: OnboardingProgress): OnboardingPath {
  if (!p.seller) return "/onboarding/profile";
  if (!p.hasSurvey) return "/onboarding/business";
  if (!p.verification) return "/onboarding/link";
  if (p.seller.onboardedAt) return "/dashboard";
  if (p.verification.idStatus !== "verified") return "/onboarding/verify";
  if (p.verification.bankStatus !== "verified") return "/onboarding/bank";
  return "/onboarding/plan";
}

const ORDER: OnboardingPath[] = [
  "/onboarding/profile",
  "/onboarding/business",
  "/onboarding/link",
  "/onboarding/verify",
  "/onboarding/bank",
  "/onboarding/plan",
  "/dashboard",
];

/** True when the seller has finished every step before `path`, so they may open it. */
export function canOpenStep(path: OnboardingPath, p: OnboardingProgress): boolean {
  return ORDER.indexOf(nextOnboardingPath(p)) >= ORDER.indexOf(path);
}
