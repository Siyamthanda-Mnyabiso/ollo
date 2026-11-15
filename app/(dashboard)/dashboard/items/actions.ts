"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { items } from "@/lib/db/schema";
import { itemSchema } from "@/lib/dashboard/schemas";
import { requireSeller } from "@/lib/dashboard/queries";

export interface ItemFormState {
  error?: string;
  saved?: boolean;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function addItem(_prev: ItemFormState, formData: FormData): Promise<ItemFormState> {
  const { seller } = await requireSeller();
  const parsed = itemSchema.safeParse({
    name: formData.get("name"),
    priceCents: formData.get("price"),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }
  await db.insert(items).values({ sellerId: seller.id, ...parsed.data });
  revalidatePath("/dashboard/items");
  return { saved: true };
}

export async function setItemActive(formData: FormData): Promise<void> {
  const { seller } = await requireSeller();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  const active = formData.get("active") === "true";
  await db
    .update(items)
    .set({ active })
    .where(and(eq(items.id, id.data), eq(items.sellerId, seller.id)));
  revalidatePath("/dashboard/items");
}
