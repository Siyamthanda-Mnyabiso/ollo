import { Suspense } from "react";
import { LivePage } from "@/components/public/page-shell";
import { LegalBody } from "@/components/public/legal-page";
import { TERMS } from "@/lib/public/pages";

export const metadata = { title: "Terms of service" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LivePage title={TERMS.title} subtitle={TERMS.updated}>
        <LegalBody page={TERMS} />
      </LivePage>
    </Suspense>
  );
}
