import { Wordmark } from "@/components/onboarding/ui";
import { SignInForm } from "./sign-in-form";

export const metadata = { title: "Sign up or log in" };

export default function SignInPage() {
  return (
    <main className="bg-background flex min-h-screen flex-col">
      <header className="flex h-20 items-center px-6 md:px-10">
        <Wordmark />
      </header>
      <div className="flex flex-1 items-start justify-center px-4 pb-16 md:items-center">
        <div className="bg-card w-full max-w-[480px] rounded-3xl p-6 shadow-sm md:p-8">
          <h1 className="text-primary text-3xl font-bold tracking-tight">
            Enter your phone number
          </h1>
          <p className="text-muted-foreground mt-2 text-base">
            New or returning, we send a code to your phone. No password needed.
          </p>
          <div className="mt-6">
            <SignInForm />
          </div>
        </div>
      </div>
    </main>
  );
}
