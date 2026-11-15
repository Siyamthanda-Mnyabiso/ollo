import { MockVerificationProvider } from "./mock";
import type { VerificationProvider } from "./provider";

export * from "./types";
export type { VerificationProvider } from "./provider";
export { isValidSaIdNumber } from "./sa-id";

let provider: VerificationProvider | undefined;

/**
 * The ID verification provider. No real provider is chosen yet (Smile ID and a local option
 * are being quoted), so this is always the mock. Swapping it is a change to this one function.
 */
export function getVerificationProvider(): VerificationProvider {
  provider ??= new MockVerificationProvider();
  return provider;
}

export const IDENTITY_FAILURE_MESSAGES = {
  id_invalid: "That ID number does not look right. Check it and try again.",
  name_mismatch:
    "The name on your ID does not match the name you gave us. Check your name and try again.",
  selfie_mismatch:
    "Your selfie did not match your ID photo. Take a clear selfie in good light and try again.",
  unavailable: "The ID check is not available right now. Please try again in a few minutes.",
} as const;
