"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { pollIdentity, retryIdentity } from "@/app/(onboarding)/onboarding/actions";
import { CtaButton, FormError } from "./ui";

/** Shows the checking, verified and did not match states for the ID check. */
export function IdentityStatus({
  initial,
  failureMessage,
}: {
  initial: "checking" | "verified" | "failed";
  failureMessage?: string;
}) {
  const [status, setStatus] = useState(initial);
  const [message, setMessage] = useState(failureMessage);

  useEffect(() => {
    if (status !== "checking") return;
    let cancelled = false;
    const timer = setInterval(async () => {
      const next = await pollIdentity();
      if (cancelled || next.status === "checking") return;
      if (next.status === "verified" || next.status === "failed") {
        setStatus(next.status);
        setMessage(next.message);
      }
    }, 2000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [status]);

  if (status === "checking") {
    return (
      <div role="status" className="bg-accent rounded-2xl p-5">
        <p className="font-bold">Checking your ID</p>
        <p className="text-muted-foreground mt-1 text-sm">
          This usually takes a few seconds. You can stay on this page.
        </p>
      </div>
    );
  }

  if (status === "verified") {
    return (
      <div className="space-y-5">
        <div role="status" className="bg-accent rounded-2xl p-5">
          <p className="font-bold">Your ID is verified</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Next, add the bank account we will pay you into.
          </p>
        </div>
        <Link href="/onboarding/bank">
          <CtaButton>Continue</CtaButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <FormError
        message={message ?? "We could not match your details to your ID. Please try again."}
      />
      <form action={retryIdentity}>
        <CtaButton type="submit">Try again</CtaButton>
      </form>
    </div>
  );
}
