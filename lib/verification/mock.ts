import { isValidSaIdNumber } from "./sa-id";
import type { VerificationProvider } from "./provider";
import type { IdentityCheckInput, IdentityCheckResult, IdentityFailureReason } from "./types";

/** How long the mock reports "checking" before it gives its answer. */
export const MOCK_CHECK_DELAY_MS = 2500;

/**
 * Stateless mock. The outcome and start time live in the reference itself, so it works across
 * server restarts and serverless instances.
 *
 * Outcomes are driven by the input: an invalid ID number fails at once; a name containing
 * MISMATCH fails the name check; SELFIE fails the selfie check; UNAVAILABLE simulates an outage.
 */
export class MockVerificationProvider implements VerificationProvider {
  constructor(
    private readonly delayMs = MOCK_CHECK_DELAY_MS,
    private readonly now: () => number = Date.now,
  ) {}

  async startIdentityCheck(input: IdentityCheckInput): Promise<IdentityCheckResult> {
    const startedAt = this.now();
    if (!isValidSaIdNumber(input.idNumber)) {
      return {
        reference: this.reference("id_invalid", startedAt),
        status: "failed",
        reason: "id_invalid",
      };
    }
    const name = input.fullName.toUpperCase();
    const outcome: IdentityFailureReason | "ok" = name.includes("UNAVAILABLE")
      ? "unavailable"
      : name.includes("MISMATCH")
        ? "name_mismatch"
        : name.includes("SELFIE")
          ? "selfie_mismatch"
          : "ok";
    return { reference: this.reference(outcome, startedAt), status: "checking" };
  }

  async getIdentityCheck(reference: string): Promise<IdentityCheckResult> {
    const match = /^mock_(ok|id_invalid|name_mismatch|selfie_mismatch|unavailable)_(\d+)$/.exec(
      reference,
    );
    if (!match) return { reference, status: "failed", reason: "unavailable" };
    const outcome = match[1] as IdentityFailureReason | "ok";
    if (outcome === "id_invalid") return { reference, status: "failed", reason: outcome };
    if (this.now() - Number(match[2]) < this.delayMs) return { reference, status: "checking" };
    return outcome === "ok"
      ? { reference, status: "verified" }
      : { reference, status: "failed", reason: outcome };
  }

  private reference(outcome: IdentityFailureReason | "ok", startedAt: number) {
    return `mock_${outcome}_${startedAt}`;
  }
}
