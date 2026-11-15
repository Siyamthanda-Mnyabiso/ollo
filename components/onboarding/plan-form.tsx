"use client";

import { keepForm } from "@/components/keep-form";
import { useActionState } from "react";
import { PLAN_OPTIONS } from "@/lib/sellers/options";
import { savePlan, type ActionState } from "@/app/(onboarding)/onboarding/actions";
import { CtaButton, FieldError, FormError } from "./ui";

export function PlanForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(savePlan, {});
  return (
    <form onSubmit={keepForm(action)} className="space-y-4" noValidate>
      <FormError message={state.error} />
      <fieldset className="grid gap-3">
        <legend className="sr-only">Plan</legend>
        {PLAN_OPTIONS.map((p) => (
          <label
            key={p.value}
            className="border-input bg-card has-[:checked]:border-primary has-[:checked]:bg-accent has-[:focus-visible]:ring-ring flex cursor-pointer gap-3 rounded-2xl border p-4 has-[:focus-visible]:ring-2"
          >
            <input
              type="radio"
              name="plan"
              value={p.value}
              defaultChecked={p.value === "free"}
              className="mt-1 size-4 accent-[var(--ollo-teal-900)]"
            />
            <span>
              <span className="block text-lg font-bold">{p.name}</span>
              <span className="text-primary block font-semibold">{p.price}</span>
              <span className="text-muted-foreground mt-1 block text-sm">{p.detail}</span>
            </span>
          </label>
        ))}
        <FieldError messages={state.fieldErrors?.plan} />
      </fieldset>
      <p className="text-muted-foreground text-sm">
        You start on Free. Pro is billed monthly and we will switch it on for you when billing
        opens.
      </p>
      <CtaButton type="submit" disabled={pending} className="w-full">
        {pending ? "Saving" : "Finish"}
      </CtaButton>
    </form>
  );
}
