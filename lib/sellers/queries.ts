import "server-only";
import { eq, like } from "drizzle-orm";
import { db } from "@/lib/db";
import { sellers, sellerSurvey, sellerVerification } from "@/lib/db/schema";

export async function getSellerByUserId(userId: string) {
  const [seller] = await db.select().from(sellers).where(eq(sellers.userId, userId)).limit(1);
  return seller ?? null;
}

export async function isHandleAvailable(handle: string, exceptSellerId?: string): Promise<boolean> {
  const [row] = await db
    .select({ id: sellers.id })
    .from(sellers)
    .where(eq(sellers.handle, handle))
    .limit(1);
  return !row || row.id === exceptSellerId;
}

/** Existing handles that start with `prefix`, used to pick a free one. */
export async function takenHandlesWithPrefix(prefix: string): Promise<Set<string>> {
  const rows = await db
    .select({ handle: sellers.handle })
    .from(sellers)
    .where(like(sellers.handle, `${prefix}%`));
  return new Set(rows.map((r) => r.handle));
}

export async function getOnboardingState(userId: string) {
  const seller = await getSellerByUserId(userId);
  if (!seller) return { seller: null, hasSurvey: false, verification: null };
  const [survey] = await db
    .select({ id: sellerSurvey.sellerId })
    .from(sellerSurvey)
    .where(eq(sellerSurvey.sellerId, seller.id))
    .limit(1);
  const [verification] = await db
    .select()
    .from(sellerVerification)
    .where(eq(sellerVerification.sellerId, seller.id))
    .limit(1);
  return { seller, hasSurvey: Boolean(survey), verification: verification ?? null };
}
