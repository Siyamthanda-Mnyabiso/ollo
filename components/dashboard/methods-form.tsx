"use client";

import { useActionState } from "react";
import { keepForm } from "@/components/keep-form";
import { Choice, CtaButton, FormError } from "@/components/onboarding/ui";
import {
  saveMethods,
  type MethodsState,
} from "@/app/(dashboard)/dashboard/payment-methods/actions";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/fees/config";
import { METHOD_LABELS } from "@/lib/payments/labels";

export function MethodsForm({ enabled }: { enabled: PaymentMethod[] }) {
  const [state, action, pending] = useActionState<MethodsState, FormData>(saveMethods, {});
  return (
    <form onSubmit={keepForm(action)} className="space-y-5" noValidate>
      <FormError message={state.error} />
      <fieldset>
        <legend className="mb-1.5 font-bold">Ways your customers can pay you</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {PAYMENT_METHODS.map((m) => (
            <Choice
              key={m}
              type="checkbox"
              name="methods"
              value={m}
              label={METHOD_LABELS[m]}
              defaultChecked={enabled.includes(m)}
            />
          ))}
        </div>
      </fieldset>
      <CtaButton type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </CtaButton>
      {state.saved ? (
        <p role="status" className="font-semibold">
          Saved
        </p>
      ) : null}
    </form>
  );
}
