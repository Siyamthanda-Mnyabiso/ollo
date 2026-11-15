import { describe, expect, it } from "vitest";
import { COPY_LIVE, COPY_PRELAUNCH, getCopy } from "./copy";

const strings = (value: unknown): string[] =>
  typeof value === "string"
    ? [value]
    : Array.isArray(value)
      ? value.flatMap(strings)
      : value && typeof value === "object"
        ? Object.values(value).flatMap(strings)
        : [];

describe.each([
  ["live", COPY_LIVE],
  ["pre-launch", COPY_PRELAUNCH],
])("%s copy", (_name, copy) => {
  const all = strings(copy);

  it('never says "shop" or "store"', () => {
    for (const text of all) expect(text).not.toMatch(/\b(shop|shops|store|stores)\b/i);
  });

  it("uses pay link and pay page", () => {
    const joined = all.join(" ").toLowerCase();
    expect(joined).toContain("pay link");
    expect(joined).toContain("pay page");
  });

  it("promises instant payouts only for bank payments, never cards", () => {
    const sentences = all.flatMap((t) => t.split(/(?<=\.)\s+/));
    for (const sentence of sentences) {
      if (
        /\bcard\b/i.test(sentence) &&
        /payout|paid out|your bank account/i.test(sentence) &&
        /instant(ly)?\b(?! EFT)|straight away/i.test(sentence)
      ) {
        expect(sentence).toMatch(/\bnot\b/i);
      }
    }
    const payouts = all.join(" ");
    expect(payouts).toMatch(/bank payments/i);
    expect(payouts).toMatch(/Card payments (are not|will not be) paid out instantly/);
  });
});

describe("the flag", () => {
  it("off says Launching January and invites sign-ups", () => {
    const copy = getCopy(false);
    expect(copy.hero.title).toBe("Launching January");
    expect(copy.cta.body).toMatch(/Leave your number/);
  });
  it("on describes live payments", () => {
    const copy = getCopy(true);
    expect(copy.hero.title).toBe("Get paid in seconds");
    expect(JSON.stringify(copy)).not.toMatch(/Launching/);
  });
  it("shows the real fees from the fee config", () => {
    expect(JSON.stringify(COPY_LIVE.pricing)).toMatch(/3% on each bank payment/);
    expect(JSON.stringify(COPY_LIVE.pricing)).toMatch(/3.9% on each card payment/);
    expect(JSON.stringify(COPY_LIVE.pricing)).toMatch(/2.5% on each bank payment/);
  });
});
