"use client";

import { keepForm } from "@/components/keep-form";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitIdentity, type ActionState } from "@/app/(onboarding)/onboarding/actions";
import { CtaButton, FieldError, FormError } from "./ui";

export function IdentityForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(submitIdentity, {});
  return (
    <form onSubmit={keepForm(action)} className="space-y-5" noValidate>
      <FormError message={state.error ?? notice} />
      <div>
        <Label htmlFor="idNumber" className="mb-1.5 block font-bold">
          ID number
        </Label>
        <Input
          id="idNumber"
          name="idNumber"
          inputMode="numeric"
          autoComplete="off"
          maxLength={17}
          className="h-12"
        />
        <p className="text-muted-foreground mt-1.5 text-sm">
          Your 13 digit South African ID number.
        </p>
        <FieldError messages={state.fieldErrors?.idNumber} />
      </div>
      <div>
        <Label htmlFor="selfie" className="mb-1.5 block font-bold">
          Selfie
        </Label>
        <Input
          id="selfie"
          name="selfie"
          type="file"
          accept="image/*"
          capture="user"
          className="h-12 pt-2.5"
        />
        <p className="text-muted-foreground mt-1.5 text-sm">
          A clear photo of your face in good light. We use it for this check and do not keep it.
        </p>
        <FieldError messages={state.fieldErrors?.selfie} />
      </div>
      <CtaButton type="submit" disabled={pending}>
        {pending ? "Sending" : "Check my ID"}
      </CtaButton>
    </form>
  );
}
