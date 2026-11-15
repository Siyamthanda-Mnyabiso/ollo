"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSeller } from "@/lib/dashboard/queries";
import { RefundError, refundSellerPayment } from "@/lib/payments/service";

export interface RefundState {
  error?: string;
}

const MESSAGES: Record<RefundError["code"], string> = {
  not_found: "We could not find that payment.",
  not_refundable: "Only a paid payment can be refunded, and only once.",
  insufficient_balance:
    "You do not have enough balance to refund this payment, because it has already been paid out to your bank.",
  provider_failed: "The refund could not be sent. Nothing changed. Please try again.",
};

export async function refundPayment(_prev: RefundState, formData: FormData): Promise<RefundState> {
  const { user, seller } = await requireSeller();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { error: MESSAGES.not_found };
  try {
    await refundSellerPayment({ sellerId: seller.id, paymentId: id.data, actorId: user.id });
  } catch (error) {
    if (error instanceof RefundError) return { error: MESSAGES[error.code] };
    throw error;
  }
  redirect(`/dashboard/payments/${id.data}`);
}
