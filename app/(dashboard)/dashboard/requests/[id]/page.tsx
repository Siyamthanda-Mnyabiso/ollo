import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { Card, outlineLinkClass } from "@/components/dashboard/shell";
import { CtaButton } from "@/components/onboarding/ui";
import { getRequest, requireSeller } from "@/lib/dashboard/queries";
import { getEnv } from "@/lib/env";
import { formatRand } from "@/lib/money";
import { cancelRequest } from "../actions";

export const metadata = { title: "Payment request" };

const STATUS = { open: "Open", paid: "Paid", expired: "Expired", cancelled: "Cancelled" } as const;

async function RequestContent({
  params,
}: {
  params: PageProps<"/dashboard/requests/[id]">["params"];
}) {
  const { seller } = await requireSeller();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const request = await getRequest(seller.id, id.data);
  if (!request) notFound();

  const link = `${getEnv().NEXT_PUBLIC_APP_URL}/${seller.handle}/${request.id}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(
    `Please pay ${formatRand(request.amountCents)} to ${seller.displayName}: ${link}`,
  )}`;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-primary text-3xl font-bold tracking-tight">Payment request</h1>
      <Card className="space-y-4">
        <div>
          <p className="text-3xl font-extrabold">{formatRand(request.amountCents)}</p>
          {request.description ? (
            <p className="text-muted-foreground mt-1">{request.description}</p>
          ) : null}
          <p className="mt-2 font-semibold" data-testid="request-status">
            {STATUS[request.status]}
          </p>
        </div>
        {request.status === "open" ? (
          <>
            <div className="bg-accent rounded-2xl p-4">
              <p className="text-sm font-bold">Send this link to your customer</p>
              <p
                className="text-primary mt-1 text-lg font-bold break-all"
                data-testid="request-link"
              >
                {link}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={whatsapp} target="_blank" rel="noreferrer" className={outlineLinkClass}>
                Share on WhatsApp
              </a>
              <form action={cancelRequest}>
                <input type="hidden" name="id" value={request.id} />
                <CtaButton
                  type="submit"
                  className="bg-card border-input text-foreground hover:bg-accent border"
                >
                  Cancel request
                </CtaButton>
              </form>
            </div>
          </>
        ) : null}
      </Card>
    </div>
  );
}

export default function RequestPage(props: PageProps<"/dashboard/requests/[id]">) {
  return (
    <Suspense fallback={null}>
      <RequestContent params={props.params} />
    </Suspense>
  );
}
