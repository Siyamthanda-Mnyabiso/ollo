"use client";

import { useState } from "react";
import { ChatIcon } from "@/components/public/figma-icons";
import { CopyIcon } from "@/components/dashboard/icons";

/** The pay link card on Home: the link, a Copy button and Share on WhatsApp. */
export function HomeShare({
  link,
  shownLink,
  displayName,
}: {
  link: string;
  shownLink: string;
  displayName: string;
}) {
  const [copied, setCopied] = useState(false);
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`Pay ${displayName} here: ${link}`)}`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }
  return (
    <>
      <div className="flex items-center gap-2">
        <p
          className="min-w-0 flex-1 text-base leading-6 font-bold [overflow-wrap:anywhere] text-[var(--ollo-teal-700)]"
          data-testid="pay-link"
        >
          {shownLink}
        </p>
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-[var(--ollo-teal-700)] bg-white px-6 text-base font-bold text-[var(--ollo-teal-700)]"
        >
          <CopyIcon size={24} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <a
        href={whatsapp}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-12 items-center justify-center gap-2 self-stretch rounded-xl bg-[var(--ollo-mint-500)] px-6 text-base font-bold text-[var(--ollo-teal-900)] md:self-start"
      >
        <ChatIcon size={24} />
        Share on WhatsApp
      </a>
    </>
  );
}
