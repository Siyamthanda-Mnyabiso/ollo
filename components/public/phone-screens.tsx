import QRCode from "qrcode";
import type { ReactNode } from "react";
import { formatRand } from "@/lib/money";

/*
 * The two phone mockups that show screens the app really has: the seller's share screen and the
 * payouts screen. They are drawn with the dashboard's own colours and wording, with sample data,
 * and are not interactive. The other five phone slots on the landing page stay empty.
 */
function Phone({ className, children }: { className: string; children: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden rounded-[32px] border-8 border-[var(--ollo-teal-900)] bg-[var(--ollo-surface)] p-4 text-[var(--ollo-ink-900)] ${className}`}
    >
      {children}
    </div>
  );
}

const SAMPLE_LINK = "ollopay.co.za/demo-thandi";

export async function ShareScreen({ className }: { className: string }) {
  const qr = await QRCode.toString(`https://${SAMPLE_LINK}`, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
  });
  return (
    <Phone className={className}>
      <div className="flex flex-col gap-3">
        <div className="bg-accent rounded-2xl p-3">
          <p className="text-sm font-bold">Your pay link</p>
          <p className="text-primary mt-1 font-bold break-all">{SAMPLE_LINK}</p>
        </div>
        <div className="flex gap-2 text-sm font-bold">
          <span className="flex h-10 flex-1 items-center justify-center rounded-xl bg-[var(--ollo-mint-500)] text-[var(--ollo-teal-900)]">
            Copy link
          </span>
          <span className="border-primary text-primary flex h-10 flex-1 items-center justify-center rounded-xl border">
            WhatsApp
          </span>
        </div>
        <div>
          <p className="mb-2 text-sm font-bold">QR code</p>
          <div className="w-28 rounded-xl bg-white p-2" dangerouslySetInnerHTML={{ __html: qr }} />
        </div>
      </div>
    </Phone>
  );
}

const SAMPLE_PAYOUTS = [
  { when: "14 Nov 2026, 10:42", cents: 420000, status: "Paid" },
  { when: "13 Nov 2026, 16:05", cents: 185000, status: "Paid" },
  { when: "12 Nov 2026, 09:18", cents: 72500, status: "Paid" },
];

export function PayoutsScreen({ className }: { className: string }) {
  return (
    <Phone className={className}>
      <div className="flex flex-col gap-3">
        <p className="text-primary text-2xl font-bold">Payouts</p>
        <div className="bg-card rounded-2xl p-3 shadow-sm">
          <p className="text-muted-foreground text-sm">Waiting to be paid out</p>
          <p className="text-2xl font-extrabold">{formatRand(0)}</p>
        </div>
        <div className="bg-card rounded-2xl p-3 shadow-sm">
          <p className="font-bold">Your bank account</p>
          <p className="text-sm">Capitec, account ending 7890</p>
        </div>
        <div className="bg-card rounded-2xl p-3 shadow-sm">
          <p className="font-bold">Payout history</p>
          <ul className="divide-border mt-1 divide-y">
            {SAMPLE_PAYOUTS.map((p) => (
              <li key={p.when} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="text-muted-foreground">{p.when}</span>
                <span className="text-right">
                  <span className="block font-bold">{formatRand(p.cents)}</span>
                  <span className="text-muted-foreground block">{p.status}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Phone>
  );
}
