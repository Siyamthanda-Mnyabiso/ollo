import Link from "next/link";
import type { ReactNode } from "react";
import { OlloLogo } from "@/components/brand/logo";

/**
 * The frame of the sign up and log in screens ("Sign up or log in" and "OTP verification" in
 * Figma): on desktop a 640 wide teal brand panel beside a white form panel, on a phone a single
 * white column with the logo on top.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col bg-white md:flex-row">
      <aside className="hidden w-[44.44%] shrink-0 flex-col justify-between bg-[var(--ollo-teal-900)] p-10 text-white md:flex lg:p-16">
        <Link href="/" aria-label="Ollo home" className="w-fit">
          <OlloLogo className="h-14" />
        </Link>
        <div className="flex max-w-[512px] flex-col gap-6">
          <p className="text-4xl leading-tight font-bold tracking-[-0.01em] lg:text-[56px] lg:leading-[60px]">
            Payments for independent businesses.
          </p>
          <p className="text-xl leading-7 text-[#d3f6e7]">
            Get paid, sell online, and grow your business without the complexity.
          </p>
        </div>
      </aside>
      <div className="flex flex-1 flex-col gap-8 px-4 pt-6 pb-12 md:items-center md:justify-center md:p-10 lg:p-16">
        <Link
          href="/"
          aria-label="Ollo home"
          className="w-fit text-[var(--ollo-teal-900)] md:hidden"
        >
          <OlloLogo className="h-8" />
        </Link>
        <div className="mx-auto flex w-full max-w-[440px] flex-col gap-8 md:mx-0">{children}</div>
      </div>
    </main>
  );
}
