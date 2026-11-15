/**
 * Pure double-entry helpers. Signed amounts: debit is positive, credit is negative.
 * Every transaction must sum to zero.
 */
export interface LedgerLine {
  accountId: string;
  amountCents: number;
  paymentId?: string;
  payoutId?: string;
  memo?: string;
}

export class LedgerImbalanceError extends Error {
  constructor(public readonly sum: number) {
    super(`Ledger transaction does not balance: entries sum to ${sum} cents`);
    this.name = "LedgerImbalanceError";
  }
}

export function assertBalanced(lines: readonly LedgerLine[]): void {
  if (lines.length < 2) throw new Error("A ledger transaction needs at least two entries");
  for (const l of lines) {
    if (!Number.isSafeInteger(l.amountCents) || l.amountCents === 0) {
      throw new RangeError("Ledger amounts must be non-zero integer cents");
    }
  }
  const sum = lines.reduce((total, l) => total + l.amountCents, 0);
  if (sum !== 0) throw new LedgerImbalanceError(sum);
}

export interface SettlementAccounts {
  /** Money Ollo is owed by Stitch (asset). */
  stitchClearing: string;
  /** What Ollo owes this seller (liability). */
  sellerBalance: string;
  /** Ollo fee income (revenue). */
  feeIncome: string;
}

/**
 * A successful payment: Stitch holds the full amount, the seller is owed the
 * amount minus the fee, and Ollo books the fee as income.
 */
export function paymentSettlementLines(args: {
  paymentId: string;
  amountCents: number;
  feeCents: number;
  accounts: SettlementAccounts;
}): LedgerLine[] {
  const { paymentId, amountCents, feeCents, accounts } = args;
  if (feeCents < 0 || feeCents > amountCents) throw new RangeError("Invalid fee");
  const lines: LedgerLine[] = [
    { accountId: accounts.stitchClearing, amountCents, paymentId, memo: "Payment received" },
    {
      accountId: accounts.sellerBalance,
      amountCents: -(amountCents - feeCents),
      paymentId,
      memo: "Owed to seller",
    },
  ];
  if (feeCents > 0) {
    lines.push({
      accountId: accounts.feeIncome,
      amountCents: -feeCents,
      paymentId,
      memo: "Ollo fee",
    });
  }
  return lines;
}

/** A payout leaving: the seller is owed less, and Stitch clearing goes down. */
export function payoutLines(args: {
  payoutId: string;
  paymentId?: string;
  amountCents: number;
  accounts: Pick<SettlementAccounts, "stitchClearing" | "sellerBalance">;
}): LedgerLine[] {
  const { payoutId, paymentId, amountCents, accounts } = args;
  return [
    {
      accountId: accounts.sellerBalance,
      amountCents,
      payoutId,
      paymentId,
      memo: "Payout to seller",
    },
    {
      accountId: accounts.stitchClearing,
      amountCents: -amountCents,
      payoutId,
      paymentId,
      memo: "Paid out via Stitch",
    },
  ];
}
