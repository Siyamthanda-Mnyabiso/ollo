import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sellers } from "@/lib/db/schema";

export function listSellers() {
  return db.select().from(sellers).orderBy(desc(sellers.createdAt)).limit(200);
}

export async function getSellerById(id: string) {
  const [row] = await db.select().from(sellers).where(eq(sellers.id, id)).limit(1);
  return row ?? null;
}
