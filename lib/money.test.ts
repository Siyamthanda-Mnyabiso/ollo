import { describe, expect, it } from "vitest";
import { formatRand, parseRandsToCents } from "./money";

describe("parseRandsToCents", () => {
  it.each([
    ["120", 12000],
    ["120.5", 12050],
    ["120.50", 12050],
    ["R 1 200,50", 120050],
    ["0.05", 5],
    ["  75 ", 7500],
  ])("parses %s", (input, cents) => expect(parseRandsToCents(input)).toBe(cents));

  it.each(["", "abc", "12.345", "-5", "1e3", "12..5", "R"])("rejects %s", (input) =>
    expect(parseRandsToCents(input)).toBeNull(),
  );
});

describe("formatRand", () => {
  it("formats cents as rand", () => {
    expect(formatRand(12050)).toMatch(/^R\s?120,50$/);
    expect(formatRand(0)).toMatch(/^R\s?0,00$/);
  });
});
