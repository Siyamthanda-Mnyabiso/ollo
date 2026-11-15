import { describe, expect, it } from "vitest";
import { LEGAL_NOTICE, LEGAL_PLACEHOLDER, PRICING, PRIVACY, TERMS } from "./pages";
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

  it('never says "instantly", so cards are never promised an instant payout', () => {
    for (const text of all) expect(text).not.toMatch(/instant/i);
  });

  it("uses the approved sentences", () => {
    expect(copy.hero.body).toBe(
      "A pay link, a simple checkout and one place to see every payment.",
    );
    expect(copy.how.steps[0]!.body).toBe("Pick your link, add your business name and logo.");
    expect(copy.how.steps[2]!.title).toBe("Customers pay");
    expect(copy.how.steps[3]!.title).toBe("Money in your bank");
    expect(copy.features.items[2]!.body).toBe(
      "See every payment and customer without scrolling through chats.",
    );
    expect(copy.how.steps[2]!.body).toBe(
      "Customers tap your link, pay from their banking app, and the money goes to your bank account.",
    );
    expect(copy.features.title).toBe("Everything you need to get paid");
    expect(copy.features.items[1]!.title).toBe("A simple checkout");
    expect(copy.features.items[1]!.body).toBe(
      "Customers pay in a few taps, with no account and no app.",
    );
    expect(copy.features.items[2]!.title).toBe("Payments in one place");
    expect(copy.hero.payoutCard.status).toBe("Paid in seconds with pay by bank");
  });

  it("does not make items a step and has no waitlist count", () => {
    expect(copy.how.steps.map((s) => s.body).join(" ")).not.toMatch(/product|item/i);
    expect(all.join(" ")).not.toMatch(/on the waitlist|3,842/);
  });
});

describe("the flag", () => {
  it("off: Launching January label, founding seller button, original band button, payouts from January", () => {
    const copy = getCopy(false);
    expect(copy.hero.label).toBe("Launching January");
    expect(copy.hero.primaryButton).toBe("Join as a founding seller");
    expect(copy.join.title).toBe("Join as a founding seller");
    expect(copy.join.body).toBe(
      "Payments are coming soon. Set up your pay page now and be first in line.",
    );
    expect(copy.join.button).toBe("Create your free pay page");
    expect(copy.how.steps[3]!.body).toBe("Payouts go straight to your bank account. From January.");
    expect(copy.features.items[3]!.body).toBe(
      "Payouts go straight to your bank account. From January.",
    );
  });
  it("on: Get your pay link, no label, Start getting paid today, no coming soon", () => {
    const copy = getCopy(true);
    expect(copy.hero.label).toBeNull();
    expect(copy.hero.primaryButton).toBe("Get your pay link");
    expect(copy.join.title).toBe("Start getting paid today");
    expect(copy.join.body).toBe("Set up your pay link in minutes and share it anywhere you sell.");
    expect(copy.how.steps[3]!.body).toBe("Payouts go straight to your bank account.");
    expect(JSON.stringify(copy)).not.toMatch(/Launching|founding|coming soon|From January/i);
  });
});

describe("pricing page", () => {
  it("shows the agreed fees and leaves out the unconfirmed lines", () => {
    const text = JSON.stringify(PRICING);
    expect(text).toMatch(/3% per bank payment/);
    expect(text).toMatch(/3.9% per card payment/);
    expect(text).toMatch(/R149 a month/);
    expect(text).toMatch(/2.5% per bank payment/);
    expect(text).not.toMatch(/product listing|order request|instantly|insights|discount|staff/i);
  });
});

describe("legal pages", () => {
  it("are marked as placeholders for a lawyer", () => {
    expect(LEGAL_NOTICE.body).toMatch(/legal adviser/);
    expect(LEGAL_PLACEHOLDER).toMatch(/lawyer/);
    expect(TERMS.sections).toHaveLength(9);
    expect(PRIVACY.sections).toHaveLength(7);
  });
});
