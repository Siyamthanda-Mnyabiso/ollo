import { Suspense } from "react";
import { connection } from "next/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { signupsOpen } from "@/lib/auth/signups";
import { getEnv } from "@/lib/env";
import { SignInForm, SignupsClosed } from "./sign-in-form";

export const metadata = { title: "Sign up or log in" };

async function SignIn() {
  await connection();
  return signupsOpen(getEnv()) ? <SignInForm /> : <SignupsClosed />;
}

export default function SignInPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <SignIn />
      </Suspense>
    </AuthShell>
  );
}
