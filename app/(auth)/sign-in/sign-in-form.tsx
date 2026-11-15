"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CtaButton, FormError } from "@/components/onboarding/ui";
import { checkCode, resendCode, sendCode, type SignInState } from "./actions";

export function SignInForm() {
  const [state, send, sending] = useActionState<SignInState, FormData>(sendCode, { step: "phone" });
  return state.step === "phone" ? (
    <form action={send} className="space-y-5" noValidate>
      <FormError message={state.error} />
      <div>
        <Label htmlFor="phone" className="mb-1.5 block font-bold">
          Cellphone number
        </Label>
        <div className="border-input bg-card focus-within:ring-ring flex h-12 items-center overflow-hidden rounded-lg border focus-within:ring-2">
          <span className="text-muted-foreground pl-3">+27</span>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="82 456 7890"
            className="h-full border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Use the number you sell with. We will send you a code.
        </p>
      </div>
      <CtaButton type="submit" disabled={sending} className="w-full">
        {sending ? "Sending" : "Send code"}
      </CtaButton>
      <p className="text-muted-foreground text-sm">
        By continuing you agree to our Terms of service and Privacy policy.
      </p>
    </form>
  ) : (
    <CodeForm state={state} />
  );
}

function CodeForm({ state }: { state: SignInState }) {
  const [current, verify, verifying] = useActionState<SignInState, FormData>(checkCode, state);
  const [resent, resend, resending] = useActionState<SignInState, FormData>(
    async (prev) => resendCode(prev),
    { step: "code", phone: state.phone },
  );
  const error = current.error ?? resent.error;
  return (
    <div className="space-y-5">
      <form action={verify} className="space-y-5" noValidate>
        <FormError message={error} />
        <div>
          <Label htmlFor="code" className="mb-1.5 block font-bold">
            Enter your code
          </Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            className="h-12 text-center text-2xl tracking-[0.5em]"
          />
          <p className="text-muted-foreground mt-1.5 text-sm">
            We sent a 6 digit code to {state.phone}.
          </p>
        </div>
        <CtaButton type="submit" disabled={verifying} className="w-full">
          {verifying ? "Checking" : "Continue"}
        </CtaButton>
      </form>
      <form action={resend}>
        <button
          type="submit"
          disabled={resending}
          className="text-primary text-base font-bold underline-offset-4 hover:underline"
        >
          {resending ? "Sending" : "Send a new code"}
        </button>
      </form>
    </div>
  );
}
