import { describe, expect, it } from "vitest";
import { businessSchema, linkSchema, profileSchema } from "./schemas";
import { slugify, uniqueHandle } from "./slug";

describe("slugify", () => {
  it.each([
    ["Thandi Hair", "thandi-hair"],
    ["Thandi's Hair!", "thandis-hair"],
    ["  Café   Noir  ", "cafe-noir"],
    ["!!!", "shop"],
    ["A", "shop"],
    ["Admin", "admin-shop"],
    ["x".repeat(60), "x".repeat(30)],
  ])("%s -> %s", (input, expected) => expect(slugify(input)).toBe(expected));
});

describe("uniqueHandle", () => {
  it("returns the base when free and numbers it when taken", () => {
    expect(uniqueHandle("thandi", new Set())).toBe("thandi");
    expect(uniqueHandle("thandi", new Set(["thandi"]))).toBe("thandi-2");
    expect(uniqueHandle("thandi", new Set(["thandi", "thandi-2"]))).toBe("thandi-3");
  });
  it("stays within 30 characters", () => {
    const base = "x".repeat(30);
    expect(uniqueHandle(base, new Set([base])).length).toBeLessThanOrEqual(30);
  });
});

describe("onboarding schemas", () => {
  it("validates the profile", () => {
    expect(
      profileSchema.safeParse({
        fullName: "Thandi Ndlovu",
        displayName: "Thandi Hair",
        category: "Hair and beauty",
      }).success,
    ).toBe(true);
    expect(
      profileSchema.safeParse({ fullName: "T", displayName: "", category: "Nope" }).success,
    ).toBe(false);
  });
  it("requires at least one channel, a range and a current payment method", () => {
    const ok = {
      channels: ["Instagram"],
      monthlySalesRange: "5k_20k",
      currentPaymentMethods: ["Cash"],
    };
    expect(businessSchema.safeParse(ok).success).toBe(true);
    expect(businessSchema.safeParse({ ...ok, channels: [] }).success).toBe(false);
    expect(businessSchema.safeParse({ ...ok, monthlySalesRange: "huge" }).success).toBe(false);
    expect(businessSchema.safeParse({ ...ok, currentPaymentMethods: [] }).success).toBe(false);
  });
  it("validates and normalises the handle", () => {
    expect(linkSchema.parse({ handle: " ThandiHair " }).handle).toBe("thandihair");
    expect(linkSchema.safeParse({ handle: "admin" }).success).toBe(false);
  });
});

import { bankSchema, planSchema } from "./schemas";

describe("bankSchema and planSchema", () => {
  const ok = { bankName: "Capitec", accountNumber: "1234 5678 90", accountHolder: "Thandi Ndlovu" };
  it("strips spaces and hyphens from the account number", () => {
    expect(bankSchema.parse(ok).accountNumber).toBe("1234567890");
    expect(bankSchema.parse({ ...ok, accountNumber: "1234-5678-90" }).accountNumber).toBe(
      "1234567890",
    );
  });
  it("rejects bad banks, account numbers and holders", () => {
    expect(bankSchema.safeParse({ ...ok, bankName: "Mattress Bank" }).success).toBe(false);
    expect(bankSchema.safeParse({ ...ok, accountNumber: "12345" }).success).toBe(false);
    expect(bankSchema.safeParse({ ...ok, accountNumber: "12345abc67" }).success).toBe(false);
    expect(bankSchema.safeParse({ ...ok, accountHolder: "T" }).success).toBe(false);
  });
  it("accepts only free or pro", () => {
    expect(planSchema.safeParse({ plan: "pro" }).success).toBe(true);
    expect(planSchema.safeParse({ plan: "enterprise" }).success).toBe(false);
  });
});

import { BANK_FAILURE_MESSAGES } from "./messages";

describe("bank failure messages", () => {
  it("has a distinct plain message for each failed-check reason", () => {
    const messages = Object.values(BANK_FAILURE_MESSAGES);
    expect(Object.keys(BANK_FAILURE_MESSAGES).sort()).toEqual([
      "account_not_found",
      "name_mismatch",
      "unavailable",
    ]);
    expect(new Set(messages).size).toBe(3);
  });
});
