"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSeller } from "@/lib/dashboard/queries";
import { db } from "@/lib/db";
import { auditLog, sellers } from "@/lib/db/schema";
import { saveVerifiedBank } from "@/lib/sellers/bank";
import { bankSchema } from "@/lib/sellers/schemas";

export interface SettingsState {
  error?: string;
  saved?: boolean;
  fieldErrors?: Record<string, string[] | undefined>;
}

const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Enter the name customers will see")
    .max(60, "Keep it under 60 characters"),
  bio: z.string().trim().max(160, "Keep it under 160 characters").optional(),
});

export async function saveSettingsProfile(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { user, seller } = await requireSeller();
  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    bio: formData.get("bio") || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }
  await db.transaction(async (tx) => {
    await tx
      .update(sellers)
      .set({ displayName: parsed.data.displayName, bio: parsed.data.bio ?? null })
      .where(eq(sellers.id, seller.id));
    await tx.insert(auditLog).values({
      actor: user.id,
      action: "seller.profile_changed",
      entity: "sellers",
      entityId: seller.id,
      before: { displayName: seller.displayName },
      after: { displayName: parsed.data.displayName },
    });
  });
  revalidatePath("/dashboard/settings");
  return { saved: true };
}

export async function changeBank(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const { user, seller } = await requireSeller();
  const parsed = bankSchema.safeParse({
    bankName: formData.get("bankName"),
    accountNumber: formData.get("accountNumber"),
    accountHolder: formData.get("accountHolder"),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }
  const saved = await saveVerifiedBank({
    sellerId: seller.id,
    userId: user.id,
    mode: "change",
    input: parsed.data,
  });
  if (!saved.ok) return { error: saved.message };
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/payouts");
  return { saved: true };
}
