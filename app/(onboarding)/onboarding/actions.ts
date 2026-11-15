"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { auditLog, sellers, sellerSurvey, sellerVerification } from "@/lib/db/schema";
import { handleSchema } from "@/lib/handles";
import { businessSchema, linkSchema, profileSchema } from "@/lib/sellers/schemas";
import { slugify, uniqueHandle } from "@/lib/sellers/slug";
import {
  getSellerByUserId,
  isHandleAvailable,
  takenHandlesWithPrefix,
} from "@/lib/sellers/queries";

export interface ActionState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

const fieldErrorsOf = (error: z.ZodError) =>
  z.flattenError(error).fieldErrors as Record<string, string[]>;

export async function saveProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    displayName: formData.get("displayName"),
    category: formData.get("category"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };

  const existing = await getSellerByUserId(user.id);
  if (existing) {
    await db.update(sellers).set(parsed.data).where(eq(sellers.id, existing.id));
  } else {
    // A provisional handle from the shop name. The seller confirms or changes it on the link step.
    const base = slugify(parsed.data.displayName);
    const handle = uniqueHandle(base, await takenHandlesWithPrefix(base.slice(0, 20)));
    try {
      await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(sellers)
          .values({ userId: user.id, ...parsed.data, handle })
          .returning({ id: sellers.id });
        await tx.insert(auditLog).values({
          actor: user.id,
          action: "seller.created",
          entity: "sellers",
          entityId: created.id,
          after: { handle },
        });
      });
    } catch {
      return { error: "Something went wrong saving your details. Please try again." };
    }
  }
  redirect("/onboarding/business");
}

export async function saveBusiness(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const seller = await getSellerByUserId(user.id);
  if (!seller) redirect("/onboarding/profile");

  const parsed = businessSchema.safeParse({
    channels: formData.getAll("channels"),
    monthlySalesRange: formData.get("monthlySalesRange"),
    currentPaymentMethods: formData.getAll("currentPaymentMethods"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };

  const values = {
    channels: parsed.data.channels,
    monthlySalesRange: parsed.data.monthlySalesRange as
      "under_5k" | "5k_20k" | "20k_50k" | "over_50k",
    currentPaymentMethods: parsed.data.currentPaymentMethods,
  };
  await db
    .insert(sellerSurvey)
    .values({ sellerId: seller.id, ...values })
    .onConflictDoUpdate({ target: sellerSurvey.sellerId, set: values });
  redirect("/onboarding/link");
}

/** Called as the seller types, to show whether a handle is free. */
export async function checkHandle(raw: string): Promise<{ available: boolean; message?: string }> {
  const user = await requireUser();
  const parsed = handleSchema.safeParse(raw);
  if (!parsed.success) return { available: false, message: parsed.error.issues[0]?.message };
  const seller = await getSellerByUserId(user.id);
  const available = await isHandleAvailable(parsed.data, seller?.id);
  return available ? { available: true } : { available: false, message: "That address is taken" };
}

export async function saveLink(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const seller = await getSellerByUserId(user.id);
  if (!seller) redirect("/onboarding/profile");

  const parsed = linkSchema.safeParse({ handle: formData.get("handle") });
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };
  if (!(await isHandleAvailable(parsed.data.handle, seller.id))) {
    return { fieldErrors: { handle: ["That address is taken"] } };
  }

  try {
    await db.transaction(async (tx) => {
      await tx.update(sellers).set({ handle: parsed.data.handle }).where(eq(sellers.id, seller.id));
      // Marks the link step as done and gives the next steps a row to fill in.
      await tx.insert(sellerVerification).values({ sellerId: seller.id }).onConflictDoNothing();
      await tx.insert(auditLog).values({
        actor: user.id,
        action: "seller.handle_set",
        entity: "sellers",
        entityId: seller.id,
        before: { handle: seller.handle },
        after: { handle: parsed.data.handle },
      });
    });
  } catch {
    // Two sellers choosing the same handle at once: the unique index rejects the second.
    return { fieldErrors: { handle: ["That address is taken"] } };
  }
  redirect("/onboarding/verify");
}
