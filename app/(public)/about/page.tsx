import { Suspense } from "react";
import { LivePage } from "@/components/public/page-shell";
import { AboutBody } from "@/components/public/about-page";
import { ABOUT } from "@/lib/public/pages";

export const metadata = { title: "About" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LivePage active="/about" title={ABOUT.hero.title} subtitle={ABOUT.hero.body}>
        <AboutBody />
      </LivePage>
    </Suspense>
  );
}
