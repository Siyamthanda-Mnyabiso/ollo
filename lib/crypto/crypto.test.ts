import { describe, expect, it } from "vitest";
import { decryptField, encryptField } from "./index";

const key = Buffer.alloc(32, 7).toString("base64");

describe("field encryption", () => {
  it("round trips", () => {
    expect(decryptField(encryptField("9001015800085", key), key)).toBe("9001015800085");
  });
  it("uses a fresh IV each time", () => {
    expect(encryptField("same", key)).not.toBe(encryptField("same", key));
  });
  it("fails with the wrong key or tampered data", () => {
    const enc = encryptField("secret", key);
    expect(() => decryptField(enc, Buffer.alloc(32, 9).toString("base64"))).toThrow();
    expect(() => decryptField(enc.slice(0, -2) + "AA", key)).toThrow();
  });
});
