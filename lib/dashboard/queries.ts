import "server-only";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { items, paymentRequests, payments } from "@/lib/db/schema";
import { getSellerByUserId } from "@/lib/sellers/queries";

/** The signed-in seller, who has finished onboarding. Anyone else is sent where they belong. */
export async function requireSeller() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const seller = await getSellerByUserId(user.id);
  if (!seller?.onboardedAt) redirect("/onboarding");
  return { user, seller };
}

export const RANGES = {
  today: { label: "Today", days: 0 },
  "7d": { label: "7 days", days: 7 },
  "30d": { label: "30 days", days: 30 },
} as const;
export type RangeKey = keyof typeof RANGES;

export function parseRange(value: string | undefined): RangeKey {
  return value && value in RANGES ? (value as RangeKey) : "today";
}

function since(range: RangeKey) {
  const d = new Date();
  if (RANGES[range].days === 0) d.setHours(0, 0, 0, 0);
  else d.setTime(d.getTime() - RANGES[range].days * 24 * 60 * 60 * 1000);
  return d;
}

/** Money in for a period: what customers paid, the Ollo fee, and what the seller keeps. */
export async function getMoneyIn(sellerId: string, range: RangeKey) {
  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
      grossCents: sql<number>`coalesce(sum(${payments.amountCents}), 0)::bigint`.mapWith(Number),
      feeCents: sql<number>`coalesce(sum(${payments.feeCents}), 0)::bigint`.mapWith(Number),
    })
    .from(payments)
    .where(
      and(
        eq(payments.sellerId, sellerId),
        eq(payments.status, "succeeded"),
        gte(payments.createdAt, since(range)),
      ),
    );
  return { count: row?.count ?? 0, grossCents: row?.grossCents ?? 0, feeCents: row?.feeCents ?? 0 };
}

/** Money in between two moments. Used to compare a period with the one before it. */
export async function getMoneyBetween(sellerId: string, from: Date, to: Date) {
  const [row] = await db
    .select({
      grossCents: sql<number>`coalesce(sum(${payments.amountCents}), 0)::bigint`.mapWith(Number),
    })
    .from(payments)
    .where(
      and(
        eq(payments.sellerId, sellerId),
        eq(payments.status, "succeeded"),
        gte(payments.createdAt, from),
        lt(payments.createdAt, to),
      ),
    );
  return row?.grossCents ?? 0;
}

/** The period right before the chosen one, as long, so the two can be compared. */
export function previousPeriod(range: RangeKey) {
  const start = since(range);
  if (RANGES[range].days === 0) {
    const from = new Date(start);
    from.setDate(from.getDate() - 1);
    return { from, to: start, label: "yesterday" };
  }
  const length = RANGES[range].days * 24 * 60 * 60 * 1000;
  return {
    from: new Date(start.getTime() - length),
    to: start,
    label: `the previous ${RANGES[range].days} days`,
  };
}

/** Payments started in the period that are still waiting for the customer to pay. */
export async function getPendingCount(sellerId: string, range: RangeKey) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(payments)
    .where(
      and(
        eq(payments.sellerId, sellerId),
        eq(payments.status, "pending"),
        gte(payments.createdAt, since(range)),
      ),
    );
  return row?.count ?? 0;
}

export function getRecentPayments(sellerId: string, limit = 8) {
  return db
    .select()
    .from(payments)
    .where(eq(payments.sellerId, sellerId))
    .orderBy(desc(payments.createdAt))
    .limit(limit);
}

export function listRequests(sellerId: string) {
  return db
    .select()
    .from(paymentRequests)
    .where(eq(paymentRequests.sellerId, sellerId))
    .orderBy(desc(paymentRequests.createdAt))
    .limit(50);
}

export async function getRequest(sellerId: string, id: string) {
  const [row] = await db
    .select()
    .from(paymentRequests)
    .where(and(eq(paymentRequests.id, id), eq(paymentRequests.sellerId, sellerId)))
    .limit(1);
  return row ?? null;
}

export function listItems(sellerId: string) {
  return db.select().from(items).where(eq(items.sellerId, sellerId)).orderBy(desc(items.createdAt));
}

export const PAYMENT_STATUS_LABEL = {
  pending: "Waiting",
  succeeded: "Paid",
  failed: "Failed",
  expired: "Expired",
  refunded: "Refunded",
} as const;

export function listPayments(sellerId: string, status?: keyof typeof PAYMENT_STATUS_LABEL) {
  return db
    .select()
    .from(payments)
    .where(
      status
        ? and(eq(payments.sellerId, sellerId), eq(payments.status, status))
        : eq(payments.sellerId, sellerId),
    )
    .orderBy(desc(payments.createdAt))
    .limit(100);
}

export async function getPayment(sellerId: string, id: string) {
  const [row] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.id, id), eq(payments.sellerId, sellerId)))
    .limit(1);
  return row ?? null;
}
