"use client";

import { keepForm } from "@/components/keep-form";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Choice, CtaButton, FieldError, FormError } from "@/components/onboarding/ui";
import { payNow, type PayFormState } from "@/app/(pay)/[handle]/actions";
import { METHOD_LABELS } from "@/lib/payments/labels";
import type { PaymentMethod } from "@/lib/fees/config";

export function PayForm({
  handle,
  requestId,
  fixedAmountLabel,
  methods,
  idempotencyKey,
}: {
  handle: string;
  requestId?: string;
  fixedAmountLabel?: string;
  methods: PaymentMethod[];
  idempotencyKey: string;
}) {
  const [state, action, pending] = useActionState<PayFormState, FormData>(payNow, {});
  return (
    <form onSubmit={keepForm(action)} className="space-y-5" noValidate>
      <input type="hidden" name="handle" value={handle} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      {requestId ? <input type="hidden" name="requestId" value={requestId} /> : null}
      <FormError message={state.error} />

      {requestId ? null : (
        <div>
          <Label htmlFor="amount" className="mb-1.5 block font-bold">
            Amount in rand
          </Label>
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            className="h-12"
          />
          <FieldError messages={state.fieldErrors?.amount} />
        </div>
      )}

      <fieldset>
        <legend className="mb-1.5 font-bold">How do you want to pay?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {methods.map((m) => (
            <Choice key={m} type="radio" name="method" value={m} label={METHOD_LABELS[m]} />
          ))}
        </div>
        <FieldError messages={state.fieldErrors?.method} />
      </fieldset>

      <div>
        <Label htmlFor="buyerName" className="mb-1.5 block font-bold">
          Your name (optional)
        </Label>
        <Input id="buyerName" name="buyerName" autoComplete="name" className="h-12" />
      </div>

      <CtaButton type="submit" disabled={pending} className="w-full">
        {pending ? "One moment" : fixedAmountLabel ? `Pay ${fixedAmountLabel}` : "Pay"}
      </CtaButton>
    </form>
  );
}
