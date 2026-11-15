import { describe, expect, it } from "vitest";
import { PAYMENT_METHODS } from "@/lib/fees";
import {
  BANK_CHANGE_PAUSE_HOURS,
  isPaused,
  pauseUntilFrom,
  payoutTimingFor,
  shouldPayOut,
} from "./config";

describe("payout timing", () => {
  it("on the mock, bank methods pay out on confirmation and cards on settlement", () => {
    for (const m of ["payshap", "capitec_pay", "instant_eft"] as const) {
      expect(payoutTimingFor("mock", m)).toBe("on_confirmation");
      expect(shouldPayOut("mock", m, "confirmation")).toBe(true);
      expect(shouldPayOut("mock", m, "settlement")).toBe(false);
    }
    expect(shouldPayOut("mock", "card", "confirmation")).toBe(false);
    expect(shouldPayOut("mock", "card", "settlement")).toBe(true);
  });

  it("on a real provider every method waits for settlement by default", () => {
    for (const m of PAYMENT_METHODS) {
      expect(payoutTimingFor("stitch", m)).toBe("on_settlement");
      expect(shouldPayOut("stitch", m, "confirmation")).toBe(false);
      expect(shouldPayOut("stitch", m, "settlement")).toBe(true);
    }
  });

  it("a method is paid out at exactly one of the two moments, never both or neither", () => {
    for (const provider of ["mock", "stitch"] as const) {
      for (const m of PAYMENT_METHODS) {
        expect(
          Number(shouldPayOut(provider, m, "confirmation")) +
            Number(shouldPayOut(provider, m, "settlement")),
        ).toBe(1);
      }
    }
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
