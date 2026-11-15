"use client";

import { useActionState } from "react";
import { keepForm } from "@/components/keep-form";
import { CtaButton, FieldError, FormError } from "@/components/onboarding/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  changeBank,
  saveSettingsProfile,
  type SettingsState,
} from "@/app/(dashboard)/dashboard/settings/actions";
import { BANKS } from "@/lib/sellers/options";

export function ProfileForm({ displayName, bio }: { displayName: string; bio: string }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettingsProfile, {});
  return (
    <form onSubmit={keepForm(action)} className="space-y-5" noValidate>
      <FormError message={state.error} />
      <div>
        <Label htmlFor="displayName" className="mb-1.5 block font-bold">
          Name on your pay page
        </Label>
        <Input id="displayName" name="displayName" defaultValue={displayName} className="h-12" />
        <FieldError messages={state.fieldErrors?.displayName} />
      </div>
      <div>
        <Label htmlFor="bio" className="mb-1.5 block font-bold">
          A short line about you (optional)
        </Label>
        <Textarea id="bio" name="bio" defaultValue={bio} rows={2} />
        <FieldError messages={state.fieldErrors?.bio} />
      </div>
      <CtaButton type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </CtaButton>
      {state.saved ? (
        <p role="status" className="font-semibold">
          Saved
        </p>
      ) : null}
    </form>
  );
}

export function BankChangeForm({ pauseHours }: { pauseHours: number }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(changeBank, {});
  return (
    <form onSubmit={keepForm(action)} className="space-y-5" noValidate>
      <FormError message={state.error} />
      <p className="bg-accent rounded-2xl p-4 text-sm">
        After you change your bank account, we pause payouts for {pauseHours} hours. This protects
        you if someone else made the change. Your money stays safe in your Ollo balance.
      </p>
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
        <Input id="accountHolder" name="accountHolder" autoComplete="off" className="h-12" />
        <FieldError messages={state.fieldErrors?.accountHolder} />
      </div>
      <CtaButton type="submit" disabled={pending}>
        {pending ? "Checking" : "Check and change"}
      </CtaButton>
      {state.saved ? (
        <p role="status" className="font-semibold">
          Bank account changed. Payouts are paused for {pauseHours} hours.
        </p>
      ) : null}
    </form>
  );
}
