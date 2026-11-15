import { Suspense } from "react";
import { LivePage } from "@/components/public/page-shell";
import { HelpBody } from "@/components/public/help-page";
import { HELP } from "@/lib/public/pages";

export const metadata = { title: "Help centre" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LivePage active="/help" title={HELP.hero.title}>
        {(live) => <HelpBody live={live} />}
      </LivePage>
    </Suspense>
  );
}
