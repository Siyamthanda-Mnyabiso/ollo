import { connection } from "next/server";
import { Suspense } from "react";
import { Landing } from "@/components/public/landing";
import { getEnv } from "@/lib/env";

async function LandingContent() {
  // Read the flag on every request, not once at build time.
  await connection();
  return <Landing live={getEnv().PAYMENTS_LIVE} />;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LandingContent />
    </Suspense>
  );
}
