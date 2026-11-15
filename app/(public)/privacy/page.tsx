import { Suspense } from "react";
import { LivePage } from "@/components/public/page-shell";
import { LegalBody } from "@/components/public/legal-page";
import { PRIVACY } from "@/lib/public/pages";

export const metadata = { title: "Privacy policy" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LivePage title={PRIVACY.title} subtitle={PRIVACY.updated}>
        <LegalBody page={PRIVACY} />
      </LivePage>
    </Suspense>
  );
}
