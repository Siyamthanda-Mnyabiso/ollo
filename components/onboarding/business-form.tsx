"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CHANNELS, CURRENT_PAYMENT_METHODS, SALES_RANGES } from "@/lib/sellers/options";
import { saveBusiness, type ActionState } from "@/app/(onboarding)/onboarding/actions";
import { Choice, CtaButton, FieldError, FormError } from "./ui";

export function BusinessForm({
  defaults,
}: {
  defaults?: {
    channels?: string[];
    monthlySalesRange?: string | null;
    currentPaymentMethods?: string[];
  };
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveBusiness, {});
  return (
    <form action={action} className="space-y-6" noValidate>
      <FormError message={state.error} />
      <fieldset>
        <legend className="mb-1.5 font-bold">Where do you sell?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {CHANNELS.map((c) => (
            <Choice
              key={c}
              type="checkbox"
              name="channels"
              value={c}
              label={c}
              defaultChecked={defaults?.channels?.includes(c)}
            />
          ))}
        </div>
        <FieldError messages={state.fieldErrors?.channels} />
      </fieldset>
      <fieldset>
        <legend className="mb-1.5 font-bold">How much do you sell each month?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {SALES_RANGES.map((r) => (
            <Choice
              key={r.value}
              type="radio"
              name="monthlySalesRange"
              value={r.value}
              label={r.label}
              defaultChecked={defaults?.monthlySalesRange === r.value}
            />
          ))}
        </div>
        <FieldError messages={state.fieldErrors?.monthlySalesRange} />
      </fieldset>
      <fieldset>
        <legend className="mb-1.5 font-bold">How do customers pay you now?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {CURRENT_PAYMENT_METHODS.map((c) => (
            <Choice
              key={c}
              type="checkbox"
              name="currentPaymentMethods"
              value={c}
              label={c}
              defaultChecked={defaults?.currentPaymentMethods?.includes(c)}
            />
          ))}
        </div>
        <FieldError messages={state.fieldErrors?.currentPaymentMethods} />
      </fieldset>
      <div className="flex items-center gap-3">
        <CtaButton type="submit" disabled={pending}>
          {pending ? "Saving" : "Continue"}
        </CtaButton>
        <Link href="/onboarding/profile" className="text-primary px-3 py-2 text-base font-bold">
          Back
        </Link>
      </div>
    </form>
  );
}
