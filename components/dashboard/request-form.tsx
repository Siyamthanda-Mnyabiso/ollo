"use client";

import { keepForm } from "@/components/keep-form";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CtaButton, FieldError, FormError } from "@/components/onboarding/ui";
import { createRequest, type RequestFormState } from "@/app/(dashboard)/dashboard/requests/actions";

export function RequestForm() {
  const [state, action, pending] = useActionState<RequestFormState, FormData>(createRequest, {});
  return (
    <form onSubmit={keepForm(action)} className="space-y-5" noValidate>
      <FormError message={state.error} />
      <div>
        <Label htmlFor="amount" className="mb-1.5 block font-bold">
          Amount in rand
        </Label>
        <Input id="amount" name="amount" inputMode="decimal" autoComplete="off" className="h-12" />
        <FieldError messages={state.fieldErrors?.amountCents} />
      </div>
      <div>
        <Label htmlFor="description" className="mb-1.5 block font-bold">
          What is it for? (optional)
        </Label>
        <Input id="description" name="description" autoComplete="off" className="h-12" />
        <FieldError messages={state.fieldErrors?.description} />
      </div>
      <CtaButton type="submit" disabled={pending}>
        {pending ? "Creating" : "Create request"}
      </CtaButton>
    </form>
  );
}
