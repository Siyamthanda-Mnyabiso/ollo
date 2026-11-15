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
import { saveVerifiedBank } from "@/lib/sellers/bank";
import { canOpenStep } from "@/lib/sellers/onboarding-steps";
import { getOnboardingState } from "@/lib/sellers/queries";
import { encryptField } from "@/lib/crypto";
import { getVerificationProvider, IDENTITY_FAILURE_MESSAGES } from "@/lib/verification";
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
    // A provisional handle from the business name. The seller confirms or changes it on the link step.
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

/** Checks the account belongs to the seller (through the payment provider), then saves it encrypted. */
export async function saveBank(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const progress = await getOnboardingState(user.id);
  const seller = progress.seller;
  if (!seller) redirect("/onboarding/profile");
  // The bank step only opens once the ID check has passed.
  if (!canOpenStep("/onboarding/bank", progress)) redirect("/onboarding/verify");

  const parsed = bankSchema.safeParse({
    bankName: formData.get("bankName"),
    accountNumber: formData.get("accountNumber"),
    accountHolder: formData.get("accountHolder"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };

  const saved = await saveVerifiedBank({
    sellerId: seller.id,
    userId: user.id,
    mode: "onboarding",
    input: parsed.data,
  });
  if (!saved.ok) return { error: saved.message };
  redirect("/onboarding/plan");
}

/**
 * Finishes onboarding. Everyone starts on Free: Pro is billed monthly and billing is not
 * built yet, so choosing Pro is recorded as a request and never switches Pro on.
 */
export async function savePlan(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const progress = await getOnboardingState(user.id);
  const seller = progress.seller;
  if (!seller) redirect("/onboarding/profile");
  if (!canOpenStep("/onboarding/plan", progress)) redirect("/onboarding");

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

const MAX_SELFIE_BYTES = 5 * 1024 * 1024;

const identitySchema = z.object({
  idNumber: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^\d{13}$/, "Enter your 13 digit ID number")),
});

/** Starts the ID and selfie check. The ID number is saved encrypted; the selfie is never stored. */
export async function submitIdentity(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const seller = await getSellerByUserId(user.id);
  if (!seller) redirect("/onboarding/profile");

  const parsed = identitySchema.safeParse({ idNumber: formData.get("idNumber") });
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };

  const selfie = formData.get("selfie");
  if (!(selfie instanceof File) || selfie.size === 0 || !selfie.type.startsWith("image/"))
    return { fieldErrors: { selfie: ["Take or choose a selfie photo"] } };
  if (selfie.size > MAX_SELFIE_BYTES)
    return { fieldErrors: { selfie: ["That photo is too large. Use one under 5 MB."] } };

  let result;
  try {
    result = await getVerificationProvider().startIdentityCheck({
      idNumber: parsed.data.idNumber,
      fullName: seller.fullName,
      selfie: { bytes: new Uint8Array(await selfie.arrayBuffer()), contentType: selfie.type },
    });
  } catch {
    return { error: IDENTITY_FAILURE_MESSAGES.unavailable };
  }

  const values = {
    idNumber: encryptField(parsed.data.idNumber),
    idStatus: result.status === "failed" ? ("failed" as const) : ("checking" as const),
    idCheckReference: result.reference,
  };
  await db.transaction(async (tx) => {
    await tx
      .insert(sellerVerification)
      .values({ sellerId: seller.id, ...values })
      .onConflictDoUpdate({ target: sellerVerification.sellerId, set: values });
    await tx.insert(auditLog).values({
      actor: user.id,
      action: "seller.id_check_started",
      entity: "seller_verification",
      entityId: seller.id,
      after: { status: values.idStatus },
    });
  });
  redirect("/onboarding/verify");
}

export interface IdentityStatus {
  status: "not_started" | "checking" | "verified" | "failed";
  message?: string;
}

/** Asks the provider how the running check is going and saves the answer. Polled by the verify page. */
export async function pollIdentity(): Promise<IdentityStatus> {
  const user = await requireUser();
  const { seller, verification } = await getOnboardingState(user.id);
  if (!seller || !verification) return { status: "not_started" };
  if (verification.idStatus !== "checking" || !verification.idCheckReference)
    return { status: verification.idStatus };

  let result;
  try {
    result = await getVerificationProvider().getIdentityCheck(verification.idCheckReference);
  } catch {
    return { status: "checking" };
  }
  if (result.status === "checking") return { status: "checking" };

  const idStatus = result.status === "verified" ? "verified" : "failed";
  await db.transaction(async (tx) => {
    await tx
      .update(sellerVerification)
      .set({ idStatus })
      .where(eq(sellerVerification.sellerId, seller.id));
    await tx.insert(auditLog).values({
      actor: user.id,
      action: `seller.id_${idStatus}`,
      entity: "seller_verification",
      entityId: seller.id,
      after: result.status === "failed" ? { reason: result.reason } : {},
    });
  });
  return result.status === "failed"
    ? { status: "failed", message: IDENTITY_FAILURE_MESSAGES[result.reason] }
    : { status: "verified" };
}

/** Lets a seller whose check failed enter their details again. */
export async function retryIdentity(): Promise<void> {
  const user = await requireUser();
  const { seller, verification } = await getOnboardingState(user.id);
  if (seller && verification?.idStatus === "failed") {
    await db
      .update(sellerVerification)
      .set({ idStatus: "not_started", idCheckReference: null })
      .where(eq(sellerVerification.sellerId, seller.id));
  }
  redirect("/onboarding/verify");
}
