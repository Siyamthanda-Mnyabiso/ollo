import { describe, expect, it } from "vitest";
import { normaliseZaPhone, zaPhoneSchema } from "./phone";

describe("normaliseZaPhone", () => {
  it.each([
    ["082 456 7890", "+27824567890"],
    ["82 456 7890", "+27824567890"],
    ["+27 82 456 7890", "+27824567890"],
    ["0027824567890", "+27824567890"],
    ["27824567890", "+27824567890"],
    ["(082) 456-7890", "+27824567890"],
  ])("%s -> %s", (input, expected) => expect(normaliseZaPhone(input)).toBe(expected));

  it.each(["", "12345", "0111234567", "+1 202 555 0100", "082 456 789", "abc"])(
    "rejects %s",
    (input) => expect(normaliseZaPhone(input)).toBeNull(),
  );

  it("works as a zod schema", () => {
    expect(zaPhoneSchema.parse("0824567890")).toBe("+27824567890");
    expect(zaPhoneSchema.safeParse("nope").success).toBe(false);
  });
});
