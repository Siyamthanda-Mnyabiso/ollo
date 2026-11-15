"use client";

import { useActionState } from "react";
import { keepForm } from "@/components/keep-form";
import { CtaButton, FormError } from "@/components/onboarding/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinWaitlist, type WaitlistState } from "@/app/(public)/actions";

export function WaitlistForm() {
  const [state, action, pending] = useActionState<WaitlistState, FormData>(joinWaitlist, {});
  if (state.done) {
    return (
      <p role="status" className="text-lg font-bold">
        Thank you. We will message you when Ollo opens.
      </p>
    );
  }
  return (
    <form onSubmit={keepForm(action)} className="flex max-w-md flex-col gap-4" noValidate>
      <FormError message={state.error} />
      {/* Hidden from people. Bots fill it in. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      <div>
        <Label htmlFor="wl-phone" className="mb-1.5 block font-bold">
          Cellphone number
        </Label>
        <Input
          id="wl-phone"
          name="phone"
          inputMode="tel"
          autoComplete="tel"
          placeholder="082 456 7890"
          className="h-12"
        />
      </div>
      <CtaButton type="submit" disabled={pending}>
        {pending ? "Sending" : "Tell me when it opens"}
      </CtaButton>
    </form>
  );
}
