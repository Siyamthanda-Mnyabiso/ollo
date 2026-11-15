"use client";

import { useActionState, useEffect, useRef } from "react";
import { keepForm } from "@/components/keep-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CtaButton, FieldError, FormError } from "@/components/onboarding/ui";
import { addItem, type ItemFormState } from "@/app/(dashboard)/dashboard/items/actions";

export function ItemForm() {
  const [state, action, pending] = useActionState<ItemFormState, FormData>(addItem, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.saved) form.current?.reset();
  }, [state]);
  return (
    <form
      ref={form}
      onSubmit={keepForm(action)}
      className="grid gap-4 sm:grid-cols-[1fr_160px_auto] sm:items-start"
      noValidate
    >
      <div className="sm:col-span-3">
        <FormError message={state.error} />
      </div>
      <div>
        <Label htmlFor="name" className="mb-1.5 block font-bold">
          Item name
        </Label>
        <Input id="name" name="name" autoComplete="off" className="h-12" />
        <FieldError messages={state.fieldErrors?.name} />
      </div>
      <div>
        <Label htmlFor="price" className="mb-1.5 block font-bold">
          Price in rand
        </Label>
        <Input id="price" name="price" inputMode="decimal" autoComplete="off" className="h-12" />
        <FieldError messages={state.fieldErrors?.priceCents} />
      </div>
      <CtaButton type="submit" disabled={pending} className="sm:mt-7">
        {pending ? "Adding" : "Add item"}
      </CtaButton>
    </form>
  );
}
