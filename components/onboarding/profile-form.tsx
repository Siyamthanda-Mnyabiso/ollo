"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORIES } from "@/lib/sellers/options";
import { saveProfile, type ActionState } from "@/app/(onboarding)/onboarding/actions";
import { Choice, CtaButton, FieldError, FormError } from "./ui";

export function ProfileForm({
  defaults,
}: {
  defaults?: { fullName?: string; displayName?: string; category?: string };
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveProfile, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormError message={state.error} />
      <div>
        <Label htmlFor="fullName" className="mb-1.5 block font-bold">
          Full name
        </Label>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          defaultValue={defaults?.fullName}
          className="h-12"
        />
        <FieldError messages={state.fieldErrors?.fullName} />
      </div>
      <div>
        <Label htmlFor="displayName" className="mb-1.5 block font-bold">
          Shop name
        </Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={defaults?.displayName}
          className="h-12"
        />
        <p className="text-muted-foreground mt-1.5 text-sm">This is how customers will see you.</p>
        <FieldError messages={state.fieldErrors?.displayName} />
      </div>
      <fieldset>
        <legend className="mb-1.5 font-bold">What do you sell?</legend>
        <div className="grid gap-2">
          {CATEGORIES.map((c) => (
            <Choice
              key={c}
              type="radio"
              name="category"
              value={c}
              label={c}
              defaultChecked={defaults?.category === c}
            />
          ))}
        </div>
        <FieldError messages={state.fieldErrors?.category} />
      </fieldset>
      <CtaButton type="submit" disabled={pending} className="w-full">
        {pending ? "Saving" : "Continue"}
      </CtaButton>
    </form>
  );
}
