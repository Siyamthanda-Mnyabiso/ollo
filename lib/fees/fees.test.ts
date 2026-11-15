import { describe, expect, it } from "vitest";
import { calculateFeeCents, netAmountCents } from "./index";

describe("calculateFeeCents", () => {
  it("charges 3% on bank payments on the free plan", () => {
    expect(calculateFeeCents({ amountCents: 100_000, method: "payshap", plan: "free" })).toBe(3000);
    expect(calculateFeeCents({ amountCents: 100_000, method: "capitec_pay", plan: "free" })).toBe(
      3000,
    );
    expect(calculateFeeCents({ amountCents: 100_000, method: "instant_eft", plan: "free" })).toBe(
      3000,
    );
  });

  it("charges 3.9% on card payments on the free plan", () => {
    expect(calculateFeeCents({ amountCents: 100_000, method: "card", plan: "free" })).toBe(3900);
  });

  it("charges 2.5% on bank payments on the pro plan", () => {
    expect(calculateFeeCents({ amountCents: 100_000, method: "payshap", plan: "pro" })).toBe(2500);
  });

  it("charges 3.9% on card payments on the pro plan", () => {
    expect(calculateFeeCents({ amountCents: 100_000, method: "card", plan: "pro" })).toBe(3900);
  });

  it("rounds half up", () => {
    // 3% of 5_050 = 151.5 -> 152
    expect(calculateFeeCents({ amountCents: 5050, method: "payshap", plan: "free" })).toBe(152);
    // 3% of 5_049 = 151.47 -> 151
    expect(calculateFeeCents({ amountCents: 5049, method: "payshap", plan: "free" })).toBe(151);
    // 2.5% of 6_020 = 150.5 -> 151
    expect(calculateFeeCents({ amountCents: 6020, method: "payshap", plan: "pro" })).toBe(151);
    // 3.9% of 10_000_001 = 390_000.039 -> 390_000
    expect(calculateFeeCents({ amountCents: 10_000_001, method: "card", plan: "free" })).toBe(
      390_000,
    );
  });

  it("applies the minimum fee of 100 cents", () => {
    // 3% of R20.00 = 60 cents -> minimum 100
    expect(calculateFeeCents({ amountCents: 2000, method: "payshap", plan: "free" })).toBe(100);
    expect(calculateFeeCents({ amountCents: 3333, method: "payshap", plan: "free" })).toBe(100);
  });

  it("switches from minimum to percentage at the boundary", () => {
    // 3% of 3_334 = 100.02 -> 100; 3% of 3_350 = 100.5 -> 101
    expect(calculateFeeCents({ amountCents: 3334, method: "payshap", plan: "free" })).toBe(100);
    expect(calculateFeeCents({ amountCents: 3350, method: "payshap", plan: "free" })).toBe(101);
  });

  it("never charges more than the payment amount", () => {
    expect(calculateFeeCents({ amountCents: 50, method: "card", plan: "free" })).toBe(50);
    expect(calculateFeeCents({ amountCents: 100, method: "card", plan: "free" })).toBe(100);
  });

  it("always returns an integer", () => {
    for (const amountCents of [101, 999, 1234, 98_765, 123_457]) {
      for (const method of ["payshap", "card"] as const) {
        for (const plan of ["free", "pro"] as const) {
          expect(Number.isInteger(calculateFeeCents({ amountCents, method, plan }))).toBe(true);
        }
      }
    }
  });

  it("rejects amounts that are not positive integers", () => {
    for (const amountCents of [0, -1, 10.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => calculateFeeCents({ amountCents, method: "card", plan: "free" })).toThrow(
        RangeError,
      );
    }
  });
});

describe("netAmountCents", () => {
  it("is the amount minus the fee", () => {
    expect(netAmountCents({ amountCents: 100_000, method: "payshap", plan: "free" })).toBe(97_000);
    expect(netAmountCents({ amountCents: 2000, method: "payshap", plan: "free" })).toBe(1900);
  });
});
