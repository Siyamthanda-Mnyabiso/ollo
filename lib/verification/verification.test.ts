import { describe, expect, it } from "vitest";
import { MockVerificationProvider } from "./mock";
import { isValidSaIdNumber } from "./sa-id";

const selfie = { bytes: new Uint8Array([1]), contentType: "image/jpeg" };
const VALID_ID = "8001015009087";

describe("isValidSaIdNumber", () => {
  it("accepts a valid number", () => expect(isValidSaIdNumber(VALID_ID)).toBe(true));
  it("rejects wrong length, letters, bad dates and bad check digits", () => {
    expect(isValidSaIdNumber("800101500908")).toBe(false);
    expect(isValidSaIdNumber("80010150090a7")).toBe(false);
    expect(isValidSaIdNumber("8013015009087")).toBe(false);
    expect(isValidSaIdNumber("8002305009087")).toBe(false);
    expect(isValidSaIdNumber("8001015009088")).toBe(false);
  });
});

describe("MockVerificationProvider", () => {
  let time = 1_000;
  const provider = new MockVerificationProvider(2_500, () => time);
  const start = (fullName: string, idNumber = VALID_ID) =>
    provider.startIdentityCheck({ idNumber, fullName, selfie });

  it("goes from checking to verified", async () => {
    time = 1_000;
    const started = await start("Thandi Ndlovu");
    expect(started.status).toBe("checking");
    expect((await provider.getIdentityCheck(started.reference)).status).toBe("checking");
    time = 4_000;
    expect((await provider.getIdentityCheck(started.reference)).status).toBe("verified");
  });

  it("fails an invalid ID number straight away", async () => {
    const started = await start("Thandi Ndlovu", "1234567890123");
    expect(started).toMatchObject({ status: "failed", reason: "id_invalid" });
  });

  it.each([
    ["Thandi MISMATCH", "name_mismatch"],
    ["Thandi SELFIE", "selfie_mismatch"],
    ["Thandi UNAVAILABLE", "unavailable"],
  ])("fails %s with %s after the delay", async (name, reason) => {
    time = 1_000;
    const started = await start(name);
    time = 4_000;
    expect(await provider.getIdentityCheck(started.reference)).toMatchObject({
      status: "failed",
      reason,
    });
  });

  it("treats an unknown reference as unavailable", async () => {
    expect(await provider.getIdentityCheck("nonsense")).toMatchObject({
      status: "failed",
      reason: "unavailable",
    });
  });
});
