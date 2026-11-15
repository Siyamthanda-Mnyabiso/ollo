import { describe, expect, it } from "vitest";
import { BANK_CHANGE_PAUSE_HOURS, isInstantPayoutMethod, isPaused, pauseUntilFrom } from "./config";

describe("instant payouts", () => {
  it("covers bank payments and never cards", () => {
    expect(isInstantPayoutMethod("payshap")).toBe(true);
    expect(isInstantPayoutMethod("capitec_pay")).toBe(true);
    expect(isInstantPayoutMethod("instant_eft")).toBe(true);
    expect(isInstantPayoutMethod("card")).toBe(false);
  });
});

describe("bank change pause", () => {
  const now = new Date("2026-11-15T10:00:00Z");
  it("pauses for the configured number of hours", () => {
    const until = pauseUntilFrom(now);
    expect(until.getTime() - now.getTime()).toBe(BANK_CHANGE_PAUSE_HOURS * 3_600_000);
  });
  it("is paused only until the end time", () => {
    const until = pauseUntilFrom(now);
    expect(isPaused(until, now)).toBe(true);
    expect(isPaused(until, until)).toBe(false);
    expect(isPaused(null, now)).toBe(false);
  });
});
