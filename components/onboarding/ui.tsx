import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ONBOARDING_STEPS } from "@/lib/sellers/options";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("text-primary text-3xl font-extrabold tracking-tight", className)}>
      ollo
    </span>
  );
}

/** The mint call to action button from the design. */
export function CtaButton({ className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      {...props}
      className={cn(
        "h-12 rounded-xl bg-[var(--ollo-mint-500)] px-6 text-base font-bold text-[var(--ollo-teal-900)] hover:bg-[var(--ollo-mint-500)]/90",
        className,
      )}
    />
  );
}

export function StepProgress({ step }: { step: number }) {
  return (
    <div className="mb-6" aria-label={`Step ${step} of ${ONBOARDING_STEPS.length}`}>
      <p className="text-muted-foreground mb-2 text-sm font-semibold">
        Step {step} of {ONBOARDING_STEPS.length}
      </p>
      <div className="flex gap-2">
        {ONBOARDING_STEPS.map((s, i) => (
          <div
            key={s.slug}
            className={cn(
              "h-2 flex-1 rounded-full",
              i < step ? "bg-[var(--ollo-mint-500)]" : "bg-[var(--ollo-mint-100)]",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function StepShell({
  step,
  title,
  subtitle,
  children,
}: {
  step: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main className="bg-background flex min-h-screen flex-col">
      <header className="flex h-20 items-center px-6 md:px-10">
        <Wordmark />
      </header>
      <div className="flex flex-1 items-start justify-center px-4 pb-16 md:items-center">
        <div className="bg-card w-full max-w-[560px] rounded-3xl p-6 shadow-sm md:p-8">
          <StepProgress step={step} />
          <h1 className="text-primary text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle ? <p className="text-muted-foreground mt-2 text-base">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}

export function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p role="alert" className="text-destructive mt-1.5 text-sm font-medium">
      {messages[0]}
    </p>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="text-foreground rounded-xl bg-[var(--ollo-warn-bg)] p-3 text-sm font-medium"
    >
      {message}
    </p>
  );
}

/** A tappable option row backed by a real radio or checkbox. */
export function Choice({
  type,
  name,
  value,
  label,
  defaultChecked,
}: {
  type: "radio" | "checkbox";
  name: string;
  value: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="border-input bg-card has-[:checked]:border-primary has-[:checked]:bg-accent has-[:focus-visible]:ring-ring flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-base has-[:focus-visible]:ring-2">
      <input
        type={type}
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="size-4 accent-[var(--ollo-teal-900)]"
      />
      <span>{label}</span>
    </label>
  );
}
