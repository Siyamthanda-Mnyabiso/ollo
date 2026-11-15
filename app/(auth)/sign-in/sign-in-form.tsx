"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { keepForm } from "@/components/keep-form";
import { FormError } from "@/components/onboarding/ui";
import { ChevronLeftIcon } from "@/components/public/figma-icons";
import { checkCode, resendCode, sendCode, type SignInState } from "./actions";

const PRIMARY =
  "inline-flex h-12 items-center justify-center rounded-xl bg-[var(--ollo-mint-500)] px-6 text-base font-bold whitespace-nowrap text-[var(--ollo-teal-900)] disabled:opacity-60";
const MUTED = "text-base leading-6 text-[var(--ollo-ink-500)]";

function Heading({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-[32px] leading-10 font-bold tracking-[-0.005em] text-[var(--ollo-ink-900)]">
        {title}
      </h1>
      <p className={MUTED}>{children}</p>
    </div>
  );
}

/** "+27824567890" as "+27 82 456 7890". */
function showPhone(e164?: string) {
  const m = e164?.match(/^\+27(\d{2})(\d{3})(\d{4})$/);
  return m ? `+27 ${m[1]} ${m[2]} ${m[3]}` : (e164 ?? "");
}

export function SignInForm() {
  const [state, send, sending] = useActionState<SignInState, FormData>(sendCode, { step: "phone" });
  // "Change number" goes back to the phone step without losing the page.
  const [back, setBack] = useState(false);
  // Sign up and log in are the same flow: we text a code either way.
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const showCode = state.step === "code" && !back;
  if (showCode) return <CodeForm state={state} onChangeNumber={() => setBack(true)} />;
  return (
    <>
      <div
        role="tablist"
        aria-label="Sign up or log in"
        className="flex gap-1 rounded-xl bg-[var(--ollo-mint-50)] p-1"
      >
        {(
          [
            ["signup", "Sign up"],
            ["login", "Log in"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            onClick={() => setMode(key)}
            className={`h-12 flex-1 rounded-lg text-base ${
              mode === key
                ? "bg-white font-bold text-[var(--ollo-ink-900)]"
                : "text-[var(--ollo-ink-500)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <Heading title="Enter your phone number">
        We will send you a code to confirm it is you.
      </Heading>
      <form
        onSubmit={(e) => {
          setBack(false);
          keepForm(send)(e);
        }}
        className="flex flex-col gap-8"
        noValidate
      >
        <FormError message={state.error} />
        <div className="flex flex-col gap-2">
          <label
            htmlFor="phone"
            className="text-base leading-6 font-bold text-[var(--ollo-ink-900)]"
          >
            Cellphone number
          </label>
          <p className={MUTED}>Use the number you sell with</p>
          <div className="flex h-12 items-center gap-2 rounded-lg border border-[#849199] bg-white px-4 focus-within:ring-2 focus-within:ring-[var(--ollo-mint-500)]">
            <span className={MUTED}>+27</span>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="82 456 7890"
              className="h-full w-full min-w-0 bg-transparent text-base text-[var(--ollo-ink-900)] outline-none placeholder:text-[var(--ollo-ink-500)]"
            />
          </div>
        </div>
        <button type="submit" disabled={sending} className={`${PRIMARY} w-full md:w-fit`}>
          {sending ? "Sending" : "Send code"}
        </button>
        <p className={MUTED}>
          By continuing you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2">
            Terms of service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy policy
          </Link>
          .
        </p>
      </form>
    </>
  );
}

function CodeForm({ state, onChangeNumber }: { state: SignInState; onChangeNumber: () => void }) {
  const [current, verify, verifying] = useActionState<SignInState, FormData>(checkCode, state);
  const [resent, resend, resending] = useActionState<SignInState, FormData>(
    async (prev) => resendCode(prev),
    { step: "code", phone: state.phone },
  );
  const [code, setCode] = useState("");
  const [seconds, setSeconds] = useState(60);
  const [resends, setResends] = useState(0);
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);
  const error = current.error ?? resent.error;
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <>
      <button
        type="button"
        onClick={onChangeNumber}
        aria-label="Change number"
        className="flex size-12 items-center justify-center text-[var(--ollo-ink-900)]"
      >
        <ChevronLeftIcon />
      </button>
      <Heading title="Enter your code">We sent a 6 digit code to {showPhone(state.phone)}.</Heading>
      <form onSubmit={keepForm(verify)} className="flex flex-col gap-8" noValidate>
        <FormError message={error} />
        <div className="relative flex gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className={`flex h-14 flex-1 items-center justify-center rounded-xl bg-white text-2xl leading-8 font-bold text-[var(--ollo-ink-900)] ${
                i === Math.min(code.length, 5)
                  ? "border-2 border-[var(--ollo-teal-700)]"
                  : "border border-[#849199]"
              }`}
            >
              {code[i] ?? ""}
            </div>
          ))}
          {/* The real field sits over the six boxes, so typing, pasting and autofill all work. */}
          <input
            name="code"
            aria-label="Enter your code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="absolute inset-0 size-full cursor-text text-transparent caret-transparent opacity-0"
          />
        </div>
        <button type="submit" disabled={verifying} className={`${PRIMARY} w-full md:w-fit`}>
          {verifying ? "Checking" : "Verify and continue"}
        </button>
      </form>
      <div className="flex items-center gap-2">
        <form
          action={async (fd) => {
            setResends((n) => n + 1);
            setSeconds(60);
            resend(fd);
          }}
          className="flex-1"
          key={resends}
        >
          {seconds > 0 ? (
            <span className={MUTED}>Resend code in {clock}</span>
          ) : (
            <button
              type="submit"
              disabled={resending}
              className="h-12 text-base font-bold text-[var(--ollo-teal-700)]"
            >
              {resending ? "Sending" : "Resend code"}
            </button>
          )}
        </form>
        <button
          type="button"
          onClick={onChangeNumber}
          className="h-12 rounded-xl px-6 text-base font-bold text-[var(--ollo-teal-700)]"
        >
          Change number
        </button>
      </div>
    </>
  );
}

/** Shown instead of the form while sign-ups are closed. */
export function SignupsClosed() {
  return (
    <>
      <Heading title="Sign-ups open soon">
        We are getting Ollo ready. Check back soon to set up your pay link.
      </Heading>
      <Link href="/" className={`${PRIMARY} w-full md:w-fit`}>
        Back to home
      </Link>
    </>
  );
}
