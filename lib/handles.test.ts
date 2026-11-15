import { describe, expect, it } from "vitest";
import { handleSchema } from "./handles";

describe("handleSchema", () => {
  it("accepts and lowercases valid handles", () => {
    expect(handleSchema.parse(" ThandiHair ")).toBe("thandihair");
    expect(handleSchema.parse("sizwe-sneakers")).toBe("sizwe-sneakers");
  });
  it("rejects bad or reserved handles", () => {
    for (const h of ["a", "-start", "has space", "x".repeat(31), "admin", "Dashboard", "sign-in"]) {
      expect(handleSchema.safeParse(h).success).toBe(false);
    }
  });
});
