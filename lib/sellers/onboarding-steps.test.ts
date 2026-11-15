import { describe, expect, it } from "vitest";
import { canOpenStep, nextOnboardingPath } from "./onboarding-steps";

const seller = { onboardedAt: null };
const base = { seller, hasSurvey: true };
const v = (idStatus: string, bankStatus = "not_started") => ({ idStatus, bankStatus });

describe("nextOnboardingPath (resuming part-way)", () => {
  it("walks the steps in order", () => {
    expect(nextOnboardingPath({ seller: null, verification: null })).toBe("/onboarding/profile");
    expect(nextOnboardingPath({ seller, hasSurvey: false, verification: null })).toBe(
      "/onboarding/business",
    );
    expect(nextOnboardingPath({ ...base, verification: null })).toBe("/onboarding/link");
    expect(nextOnboardingPath({ ...base, verification: v("not_started") })).toBe(
      "/onboarding/verify",
    );
    expect(nextOnboardingPath({ ...base, verification: v("checking") })).toBe("/onboarding/verify");
    expect(nextOnboardingPath({ ...base, verification: v("failed") })).toBe("/onboarding/verify");
    expect(nextOnboardingPath({ ...base, verification: v("verified") })).toBe("/onboarding/bank");
    expect(nextOnboardingPath({ ...base, verification: v("verified", "failed") })).toBe(
      "/onboarding/bank",
    );
    expect(nextOnboardingPath({ ...base, verification: v("verified", "verified") })).toBe(
      "/onboarding/plan",
    );
    expect(
      nextOnboardingPath({
        ...base,
        seller: { onboardedAt: new Date() },
        verification: v("verified", "verified"),
      }),
    ).toBe("/dashboard");
  });
});

describe("canOpenStep", () => {
  it("keeps the bank step closed until the ID step has passed", () => {
    expect(canOpenStep("/onboarding/bank", { ...base, verification: v("checking") })).toBe(false);
    expect(canOpenStep("/onboarding/bank", { ...base, verification: v("failed") })).toBe(false);
    expect(canOpenStep("/onboarding/bank", { ...base, verification: v("verified") })).toBe(true);
  });
  it("keeps the plan step closed until the bank is verified, and lets earlier steps reopen", () => {
    expect(
      canOpenStep("/onboarding/plan", { ...base, verification: v("verified", "failed") }),
    ).toBe(false);
    expect(
      canOpenStep("/onboarding/plan", { ...base, verification: v("verified", "verified") }),
    ).toBe(true);
    expect(
      canOpenStep("/onboarding/verify", { ...base, verification: v("verified", "verified") }),
    ).toBe(true);
  });
});
