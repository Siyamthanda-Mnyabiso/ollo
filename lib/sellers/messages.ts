/** What the seller sees when the bank account check fails. Keyed by the provider's reason. */
export const BANK_FAILURE_MESSAGES = {
  name_mismatch: "The account holder name does not match this account. Check it and try again.",
  account_not_found: "We could not find that account. Check the bank and account number.",
  unavailable: "The bank check is not available right now. Please try again in a few minutes.",
} as const;
