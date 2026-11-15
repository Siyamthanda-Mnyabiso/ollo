"use client";

import { useActionState } from "react";
import { keepForm } from "@/components/keep-form";
import { CtaButton, FieldError, FormError } from "@/components/onboarding/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setSellerLimits, type LimitsFormState } from "@/app/(admin)/admin/sellers/actions";

export function LimitsForm({
  sellerId,
  perPayment,
  perDay,
  defaults,
}: {
  sellerId: string;
  perPayment: string;
  perDay: string;
  defaults: { perPayment: string; perDay: string };
}) {
  const [state, action, pending] = useActionState<LimitsFormState, FormData>(setSellerLimits, {});
  return (
    <form onSubmit={keepForm(action)} className="space-y-5" noValidate>
      <input type="hidden" name="id" value={sellerId} />
      <FormError message={state.error} />
      <div>
        <Label htmlFor="perPayment" className="mb-1.5 block font-bold">
          Limit per payment, in rand
        </Label>
        <Input
          id="perPayment"
          name="perPayment"
          defaultValue={perPayment}
          placeholder={`Default ${defaults.perPayment}`}
          className="h-12"
        />
        <FieldError messages={state.fieldErrors?.perPayment} />
      </div>
      <div>
        <Label htmlFor="perDay" className="mb-1.5 block font-bold">
          Limit per day, in rand
        </Label>
        <Input
          id="perDay"
          name="perDay"
          defaultValue={perDay}
          placeholder={`Default ${defaults.perDay}`}
          className="h-12"
        />
        <FieldError messages={state.fieldErrors?.perDay} />
      </div>
      <p className="text-muted-foreground text-sm">Leave a box blank to use the default.</p>
      <CtaButton type="submit" disabled={pending}>
        {pending ? "Saving" : "Save limits"}
      </CtaButton>
      {state.saved ? (
        <p role="status" className="font-semibold">
          Limits saved
        </p>
      ) : null}
    </form>
  );
}
