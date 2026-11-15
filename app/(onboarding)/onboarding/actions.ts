"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { auditLog, sellers, sellerSurvey, sellerVerification } from "@/lib/db/schema";
import { handleSchema } from "@/lib/handles";
import {
  bankSchema,
  businessSchema,
  linkSchema,
  planSchema,
  profileSchema,
} from "@/lib/sellers/schemas";
import { encryptField } from "@/lib/crypto";
import { getPaymentProvider } from "@/lib/payments";
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

const BANK_FAILURE_MESSAGES = {
  name_mismatch: "The account holder name does not match this account. Check it and try again.",
  account_not_found: "We could not find that account. Check the bank and account number.",
  unavailable: "The bank check is not available right now. Please try again in a few minutes.",
} as const;

/** Checks the account belongs to the seller (through the payment provider), then saves it encrypted. */
export async function saveBank(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const seller = await getSellerByUserId(user.id);
  if (!seller) redirect("/onboarding/profile");

  const parsed = bankSchema.safeParse({
    bankName: formData.get("bankName"),
    accountNumber: formData.get("accountNumber"),
    accountHolder: formData.get("accountHolder"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };

  let result;
  try {
    result = await getPaymentProvider().verifyBankAccount(parsed.data);
  } catch {
    return { error: BANK_FAILURE_MESSAGES.unavailable };
  }

  if (!result.verified) {
    await db
      .insert(sellerVerification)
      .values({ sellerId: seller.id, bankStatus: "failed" })
      .onConflictDoUpdate({ target: sellerVerification.sellerId, set: { bankStatus: "failed" } });
    return { error: BANK_FAILURE_MESSAGES[result.reason ?? "unavailable"] };
  }

  const values = {
    bankName: parsed.data.bankName,
    accountNumber: encryptField(parsed.data.accountNumber),
    accountHolder: parsed.data.accountHolder,
    bankStatus: "verified" as const,
  };
  await db.transaction(async (tx) => {
    await tx
      .insert(sellerVerification)
      .values({ sellerId: seller.id, ...values })
      .onConflictDoUpdate({ target: sellerVerification.sellerId, set: values });
    // The account number itself never goes in the audit log.
    await tx.insert(auditLog).values({
      actor: user.id,
      action: "seller.bank_verified",
      entity: "seller_verification",
      entityId: seller.id,
      after: { bankName: parsed.data.bankName, lastFour: parsed.data.accountNumber.slice(-4) },
    });
  });
  redirect("/onboarding/plan");
}

/**
 * Finishes onboarding. Everyone starts on Free: Pro is billed monthly and billing is not
 * built yet, so choosing Pro is recorded as a request and never switches Pro on.
 */
export async function savePlan(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const seller = await getSellerByUserId(user.id);
  if (!seller) redirect("/onboarding/profile");

  const parsed = planSchema.safeParse({ plan: formData.get("plan") });
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };

  await db.transaction(async (tx) => {
    await tx.update(sellers).set({ onboardedAt: new Date() }).where(eq(sellers.id, seller.id));
    await tx.insert(auditLog).values({
      actor: user.id,
      action: parsed.data.plan === "pro" ? "seller.pro_requested" : "seller.onboarded",
      entity: "sellers",
      entityId: seller.id,
      after: { chosenPlan: parsed.data.plan, activePlan: seller.plan },
    });
  });
  redirect("/onboarding/done");
}
