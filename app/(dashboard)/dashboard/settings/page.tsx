import QRCode from "qrcode";
import { Suspense } from "react";
import { Card } from "@/components/dashboard/shell";
import { BankChangeForm, ProfileForm } from "@/components/dashboard/settings-forms";
import { ShareCard } from "@/components/dashboard/share-card";
import { requireSeller } from "@/lib/dashboard/queries";
import { getEnv } from "@/lib/env";
import { BANK_CHANGE_PAUSE_HOURS } from "@/lib/payouts/config";
import { getBankSummary } from "@/lib/payouts/service";

export const metadata = { title: "Settings" };

async function SettingsContent() {
  const { seller } = await requireSeller();
  const link = `${getEnv().NEXT_PUBLIC_APP_URL}/${seller.handle}`;
  const [qrSvg, bank] = await Promise.all([
    QRCode.toString(link, { type: "svg", margin: 0, errorCorrectionLevel: "M" }),
    getBankSummary(seller.id),
  ]);
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-primary text-3xl font-bold tracking-tight">Settings</h1>
      <Card>
        <h2 className="mb-4 text-lg font-bold">Share your pay link</h2>
        <ShareCard link={link} displayName={seller.displayName} qrSvg={qrSvg} />
      </Card>
      <Card>
        <h2 className="mb-4 text-lg font-bold">Your details</h2>
        <ProfileForm displayName={seller.displayName} bio={seller.bio ?? ""} />
      </Card>
      <Card>
        <h2 className="text-lg font-bold">Bank account</h2>
        <p className="text-muted-foreground mt-1 mb-4">
          {bank ? `${bank.bankName}, account ending ${bank.last4}` : "No verified bank account."}
        </p>
        <BankChangeForm pauseHours={BANK_CHANGE_PAUSE_HOURS} />
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}
