import { Suspense } from "react";
import { LivePage } from "@/components/public/page-shell";
import { ContactBody } from "@/components/public/contact-page";
import { CONTACT } from "@/lib/public/pages";

export const metadata = { title: "Contact" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LivePage title={CONTACT.hero.title} subtitle={CONTACT.hero.body}>
        <ContactBody />
      </LivePage>
    </Suspense>
  );
}
