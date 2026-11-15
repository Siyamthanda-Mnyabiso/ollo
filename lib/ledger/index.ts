import { randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "@/lib/db";
import { ledgerAccounts, ledgerEntries } from "@/lib/db/schema";
import { assertBalanced, type LedgerLine } from "./entries";

export * from "./entries";

/** An open database transaction. Ledger writes refuse to run without one. */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/**
 * Writes one balanced transaction. Pass the `tx` from `db.transaction(...)` so
 * the ledger rows commit or roll back together with the payment or payout row.
 */
export async function postTransaction(tx: Tx, lines: readonly LedgerLine[]): Promise<string> {
  assertBalanced(lines);
  const transactionId = randomUUID();
  await tx.insert(ledgerEntries).values(
    lines.map((l) => ({
      transactionId,
      accountId: l.accountId,
      amountCents: l.amountCents,
      paymentId: l.paymentId,
      payoutId: l.payoutId,
      memo: l.memo,
    })),
  );
  return transactionId;
}

/** Finds or creates a ledger account. `sellerId: null` means an Ollo account. */
export async function ensureAccount(
  tx: Tx,
  args: {
    sellerId: string | null;
    type: "asset" | "liability" | "revenue" | "clearing";
    name: string;
  },
): Promise<string> {
  const where = and(
    args.sellerId ? eq(ledgerAccounts.sellerId, args.sellerId) : isNull(ledgerAccounts.sellerId),
    eq(ledgerAccounts.name, args.name),
  );
  const [existing] = await tx
    .select({ id: ledgerAccounts.id })
    .from(ledgerAccounts)
    .where(where)
    .limit(1);
  if (existing) return existing.id;
  const [created] = await tx
    .insert(ledgerAccounts)
    .values({ sellerId: args.sellerId, type: args.type, name: args.name })
    .onConflictDoNothing()
    .returning({ id: ledgerAccounts.id });
  if (created) return created.id;
  const [raced] = await tx
    .select({ id: ledgerAccounts.id })
    .from(ledgerAccounts)
    .where(where)
    .limit(1);
  if (!raced) throw new Error(`Could not create ledger account ${args.name}`);
  return raced.id;
}
