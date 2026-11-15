"use client";

import { useState } from "react";
import { outlineLinkClass } from "@/components/dashboard/shell";
import { CtaButton } from "@/components/onboarding/ui";

/** Copy, WhatsApp and QR code for the seller's pay link. `qrSvg` is made on the server. */
export function ShareCard({
  link,
  displayName,
  qrSvg,
}: {
  link: string;
  displayName: string;
  qrSvg: string;
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
    <div className="space-y-4">
      <div className="bg-accent rounded-2xl p-4">
        <p className="text-sm font-bold">Your pay link</p>
        <p className="text-primary mt-1 text-lg font-bold break-all" data-testid="pay-link">
          {link}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <CtaButton type="button" onClick={copy}>
          {copied ? "Copied" : "Copy link"}
        </CtaButton>
        <a href={whatsapp} target="_blank" rel="noreferrer" className={outlineLinkClass}>
          Share on WhatsApp
        </a>
      </div>
      <div>
        <p className="mb-2 text-sm font-bold">QR code</p>
        <div
          role="img"
          aria-label={`QR code for ${link}`}
          className="w-48 rounded-xl bg-white p-3"
          data-testid="qr"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <p className="text-muted-foreground mt-2 text-sm">
          Customers can scan this with their phone camera to open your pay page.
        </p>
      </div>
    </div>
  );
}
