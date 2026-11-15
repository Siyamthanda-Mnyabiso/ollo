import type { IdentityCheckInput, IdentityCheckResult } from "./types";

/**
 * Everything Ollo needs from an ID verification service. Checks can take a while, so
 * a check is started and then polled by its reference.
 *
 * To switch provider (Smile ID or another): add one file that implements this
 * interface, then return it from getVerificationProvider() in ./index.ts.
 */
export interface VerificationProvider {
  startIdentityCheck(input: IdentityCheckInput): Promise<IdentityCheckResult>;
  getIdentityCheck(reference: string): Promise<IdentityCheckResult>;
}
