"use client";

import { keepForm } from "@/components/keep-form";
import { useActionState, useState } from "react";
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
  items = [],
}: {
  items?: { id: string; name: string; priceLabel: string }[];
  handle: string;
  requestId?: string;
  fixedAmountLabel?: string;
  methods: PaymentMethod[];
  idempotencyKey: string;
}) {
  const [state, action, pending] = useActionState<PayFormState, FormData>(payNow, {});
  const [choice, setChoice] = useState<string>(items.length ? items[0]!.id : "custom");
  return (
    <form onSubmit={keepForm(action)} className="space-y-5" noValidate>
      <input type="hidden" name="handle" value={handle} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      {requestId ? <input type="hidden" name="requestId" value={requestId} /> : null}
      <FormError message={state.error} />

      {requestId ? null : (
        <>
          {items.length > 0 ? (
            <fieldset>
              <legend className="mb-1.5 font-bold">What are you paying for?</legend>
              <div className="grid gap-2">
                {items.map((i) => (
                  <label
                    key={i.id}
                    className="border-input bg-card has-[:checked]:border-primary has-[:checked]:bg-accent flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3"
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="item"
                        value={i.id}
                        checked={choice === i.id}
                        onChange={() => setChoice(i.id)}
                        className="size-4 accent-[var(--ollo-teal-900)]"
                      />
                      {i.name}
                    </span>
                    <span className="font-bold">{i.priceLabel}</span>
                  </label>
                ))}
                <label className="border-input bg-card has-[:checked]:border-primary has-[:checked]:bg-accent flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3">
                  <input
                    type="radio"
                    name="item"
                    value="custom"
                    checked={choice === "custom"}
                    onChange={() => setChoice("custom")}
                    className="size-4 accent-[var(--ollo-teal-900)]"
                  />
                  Another amount
                </label>
              </div>
              <FieldError messages={state.fieldErrors?.item} />
            </fieldset>
          ) : null}
          {choice === "custom" ? (
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
          ) : null}
        </>
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
