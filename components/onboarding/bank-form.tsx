"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BANKS } from "@/lib/sellers/options";
import { saveBank, type ActionState } from "@/app/(onboarding)/onboarding/actions";
import { CtaButton, FieldError, FormError } from "./ui";

export function BankForm({ defaultHolder }: { defaultHolder: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveBank, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormError message={state.error} />
      <div>
        <Label htmlFor="bankName" className="mb-1.5 block font-bold">
          Bank
        </Label>
        <select
          id="bankName"
          name="bankName"
          defaultValue=""
          className="border-input bg-card focus-visible:ring-ring h-12 w-full rounded-lg border px-3 text-base focus-visible:ring-2 focus-visible:outline-none"
        >
          <option value="" disabled>
            Choose your bank
          </option>
          {BANKS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <FieldError messages={state.fieldErrors?.bankName} />
      </div>
      <div>
        <Label htmlFor="accountNumber" className="mb-1.5 block font-bold">
          Account number
        </Label>
        <Input
          id="accountNumber"
          name="accountNumber"
          inputMode="numeric"
          autoComplete="off"
          className="h-12"
        />
        <FieldError messages={state.fieldErrors?.accountNumber} />
      </div>
      <div>
        <Label htmlFor="accountHolder" className="mb-1.5 block font-bold">
          Account holder name
        </Label>
        <Input
          id="accountHolder"
          name="accountHolder"
          defaultValue={defaultHolder}
          autoComplete="off"
          className="h-12"
        />
        <p className="text-muted-foreground mt-1.5 text-sm">This must match the name on your ID.</p>
        <FieldError messages={state.fieldErrors?.accountHolder} />
      </div>
      <div className="bg-accent rounded-2xl p-4 text-sm">
        <p className="font-bold">Automatic check</p>
        <p className="mt-1">We confirm the account belongs to you. It takes a few seconds.</p>
      </div>
      <div className="flex items-center gap-3">
        <CtaButton type="submit" disabled={pending}>
          {pending ? "Checking" : "Check and save"}
        </CtaButton>
        <Link href="/onboarding/verify" className="text-primary px-3 py-2 text-base font-bold">
          Back
        </Link>
      </div>
    </form>
  );
}
