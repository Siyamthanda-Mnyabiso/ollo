export type IdentityFailureReason =
  "id_invalid" | "name_mismatch" | "selfie_mismatch" | "unavailable";

export interface IdentityCheckInput {
  /** 13 digit South African ID number, digits only. */
  idNumber: string;
  /** The name the seller gave us, to compare with the ID. */
  fullName: string;
  /** A selfie taken now. Held in memory for the check only. Ollo does not store it. */
  selfie: { bytes: Uint8Array; contentType: string };
}

export type IdentityCheckResult =
  | { reference: string; status: "checking" }
  | { reference: string; status: "verified" }
  | { reference: string; status: "failed"; reason: IdentityFailureReason };
