"use client";

import Link from "next/link";
import { useActionState } from "react";
import { keepForm } from "@/components/keep-form";
import { CtaButton, FormError } from "@/components/onboarding/ui";
import { refundPayment, type RefundState } from "@/app/(dashboard)/dashboard/payments/actions";

export function RefundForm({ id, amountLabel }: { id: string; amountLabel: string }) {
  const [state, action, pending] = useActionState<RefundState, FormData>(refundPayment, {});
  return (
    <form onSubmit={keepForm(action)} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <FormError message={state.error} />
      <div className="flex flex-wrap items-center gap-3">
        <CtaButton type="submit" disabled={pending}>
          {pending ? "Refunding" : `Refund ${amountLabel}`}
        </CtaButton>
        <Link
          href={`/dashboard/payments/${id}`}
          className="text-primary px-3 py-2 text-base font-bold"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
