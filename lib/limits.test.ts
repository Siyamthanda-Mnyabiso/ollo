import { describe, expect, it } from "vitest";
import {
  checkLimits,
  limitMessage,
  DEFAULT_SELLER_LIMITS,
  resolveLimits,
  startOfDaySouthAfrica,
} from "./limits";

describe("resolveLimits", () => {
  it("uses the defaults when a seller has no overrides", () => {
    expect(resolveLimits({ limitPerPaymentCents: null, limitPerDayCents: null })).toEqual(
      DEFAULT_SELLER_LIMITS,
    );
  });
  it("uses a seller's own limits", () => {
    expect(resolveLimits({ limitPerPaymentCents: 1000, limitPerDayCents: null })).toEqual({
      perPaymentCents: 1000,
      perDayCents: DEFAULT_SELLER_LIMITS.perDayCents,
    });
  });
});

describe("checkLimits", () => {
  const limits = { perPaymentCents: 500_000, perDayCents: 2_000_000 };
  it("allows a payment within both limits, including exactly at them", () => {
    expect(checkLimits({ amountCents: 500_000, limits, countedTodayCents: 1_500_000 })).toEqual({
      ok: true,
    });
  });
  it("blocks a payment over the per payment limit", () => {
    expect(checkLimits({ amountCents: 500_001, limits, countedTodayCents: 0 })).toEqual({
      ok: false,
      reason: "per_payment",
      limitCents: 500_000,
    });
  });
  it("blocks a payment that would take the day over the limit and says how much is left", () => {
    expect(checkLimits({ amountCents: 400_000, limits, countedTodayCents: 1_700_000 })).toEqual({
      ok: false,
      reason: "per_day",
      limitCents: 2_000_000,
      remainingCents: 300_000,
    });
  });
});

describe("startOfDaySouthAfrica", () => {
  it("is 22:00 UTC the evening before", () => {
    expect(startOfDaySouthAfrica(new Date("2026-11-15T10:00:00Z")).toISOString()).toBe(
      "2026-11-14T22:00:00.000Z",
    );
  });
  it("rolls over at midnight South African time", () => {
    expect(startOfDaySouthAfrica(new Date("2026-11-15T21:59:59Z")).toISOString()).toBe(
      "2026-11-14T22:00:00.000Z",
    );
    expect(startOfDaySouthAfrica(new Date("2026-11-15T22:00:00Z")).toISOString()).toBe(
      "2026-11-15T22:00:00.000Z",
    );
  });
});

describe("limitMessage", () => {
  it("tells the buyer what to do for each limit", () => {
    expect(
      limitMessage({ ok: false, reason: "per_payment", limitCents: 500_000 }, "Thandi Treats"),
    ).toMatch(/Thandi Treats can accept up to R5,000.00 in one payment.*smaller amount/);
    expect(
      limitMessage(
        { ok: false, reason: "per_day", limitCents: 2_000_000, remainingCents: 0 },
        "Thandi Treats",
      ),
    ).toMatch(/over their limit for today.*tomorrow/);
  });
});
