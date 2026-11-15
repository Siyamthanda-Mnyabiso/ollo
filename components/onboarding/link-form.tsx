"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkHandle, saveLink, type ActionState } from "@/app/(onboarding)/onboarding/actions";
import { CtaButton, FieldError, FormError } from "./ui";

export function LinkForm({ initialHandle, domain }: { initialHandle: string; domain: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveLink, {});
  const [handle, setHandle] = useState(initialHandle);
  const [check, setCheck] = useState<{ available: boolean; message?: string } | null>(null);
  const latest = useRef(0);

  // Checks the address 400ms after the seller stops typing. Only the latest answer is used.
  useEffect(() => {
    const id = ++latest.current;
    const timer = setTimeout(async () => {
      const result = await checkHandle(handle);
      if (id === latest.current) setCheck(result);
    }, 400);
    return () => clearTimeout(timer);
  }, [handle]);

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormError message={state.error} />
      <div>
        <Label htmlFor="handle" className="mb-1.5 block font-bold">
          Your pay link
        </Label>
        <div className="border-input bg-card focus-within:ring-ring flex h-12 items-center overflow-hidden rounded-lg border focus-within:ring-2">
          <span className="text-muted-foreground pl-3">{domain}/</span>
          <Input
            id="handle"
            name="handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase())}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-describedby="handle-status"
            className="h-full border-0 pl-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <p id="handle-status" aria-live="polite" className="mt-1.5 text-sm font-medium">
          {check?.available ? (
            <span className="text-primary">
              {domain}/{handle} is available
            </span>
          ) : check?.message ? (
            <span className="text-destructive">{check.message}</span>
          ) : (
            <span className="text-muted-foreground">Checking</span>
          )}
        </p>
        <FieldError messages={state.fieldErrors?.handle} />
      </div>
      <div className="bg-accent rounded-2xl p-4 text-sm">
        <p className="font-bold">Customers will pay you at</p>
        <p className="text-primary mt-1 text-base font-bold break-all">
          {domain}/{handle || "yourshop"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <CtaButton type="submit" disabled={pending || check?.available === false}>
          {pending ? "Saving" : "Continue"}
        </CtaButton>
        <Link href="/onboarding/business" className="text-primary px-3 py-2 text-base font-bold">
          Back
        </Link>
      </div>
    </form>
  );
}
