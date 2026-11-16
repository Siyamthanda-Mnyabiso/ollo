import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BuyerPage, ImagePlaceholder } from "@/components/pay/buyer";
import { BuyerSkeleton } from "@/components/pay/skeleton";
import { ChatIcon } from "@/components/public/figma-icons";
import { contactFor } from "@/lib/orders/contact";
import { getOrderByToken } from "@/lib/orders/service";
import { formatRandCompact } from "@/lib/money";
import { getSellerByHandle } from "@/lib/payments/service";

const shadow = "shadow-[0_1px_3px_rgba(15,31,45,0.06),0_4px_12px_rgba(15,31,45,0.06)]";
const day = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const placed = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Africa/Johannesburg",
});

function Check({ size, stroke, d }: { size: number; stroke: number; d: string }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden="true">
      <path
        d={d}
        stroke="white"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The archived "Order request sent" frame, shown while payments are off. */
async function RequestedContent({
  params,
}: {
  params: PageProps<"/[handle]/orders/[token]/requested">["params"];
}) {
  const { handle, token } = await params;
  const [seller, order] = await Promise.all([
    getSellerByHandle(handle),
    getOrderByToken(handle, token),
  ]);
  if (!seller || !order) notFound();
  const contact = contactFor(seller);
  const when = `${day.format(new Date(`${order.deliveryDate}T00:00:00Z`)).replace(",", "")}, ${order.deliverySlot}`;
  return (
    <BuyerPage
      name={seller.displayName}
      logoUrl={seller.logoUrl}
      handle={seller.handle}
      plainFooter
      width={560}
    >
      <div className="flex flex-col items-center gap-4">
        <span className="flex size-[104px] items-center justify-center rounded-full bg-[var(--ollo-mint-50)]">
          <span className="flex size-[72px] items-center justify-center rounded-full bg-[#007a4d]">
            <Check size={40} stroke={4.16667} d="M8.33331 20.8333L15.8333 28.3333L31.6666 12.5" />
          </span>
        </span>
        <h1 className="text-center text-[32px] leading-10 font-bold tracking-[-0.005em]">
          Order request sent
        </h1>
        <p className="text-center text-base leading-6 text-[var(--ollo-ink-500)]">
          {seller.displayName} will contact you on WhatsApp to confirm your order and delivery.
        </p>
      </div>

      <section className={`flex flex-col gap-6 rounded-2xl bg-white p-6 ${shadow}`}>
        <h2 className="text-xl leading-7 font-bold">What happens next</h2>
        <ol>
          <li className="flex gap-4">
            <div className="flex w-8 shrink-0 flex-col items-center gap-1">
              <span className="flex size-8 items-center justify-center rounded-full bg-[#007a4d]">
                <Check size={16} stroke={1.66667} d="M3.33334 8.33333L6.33334 11.3333L12.6667 5" />
              </span>
              <span className="w-0.5 flex-1 bg-[#007a4d]" />
            </div>
            <div className="flex flex-1 flex-col gap-1 pt-1 pb-6 text-base leading-6">
              <span className="font-bold">Request sent</span>
              <span className="text-[var(--ollo-ink-500)]">{placed.format(order.placedAt)}</span>
            </div>
          </li>
          <li className="flex gap-4">
            <div className="flex w-8 shrink-0 flex-col items-center gap-1">
              <span className="flex size-8 items-center justify-center rounded-full border-[3px] border-[var(--ollo-teal-700)] bg-white">
                <span className="size-3 rounded-full bg-[var(--ollo-teal-700)]" />
              </span>
              <span className="w-0.5 flex-1 bg-[#d5dde3]" />
            </div>
            <div className="flex flex-1 flex-col gap-1 pt-1 pb-6 text-base leading-6">
              <span className="font-bold">{seller.displayName} confirms on WhatsApp</span>
              <span className="text-[var(--ollo-ink-500)]">Keep your phone close</span>
            </div>
          </li>
          <li className="flex gap-4">
            <div className="flex w-8 shrink-0 flex-col items-center">
              <span className="size-8 rounded-full border-2 border-[#849199] bg-white" />
            </div>
            <div className="flex flex-1 flex-col gap-1 pt-1 text-base leading-6 text-[var(--ollo-ink-500)]">
              <span>You agree payment and delivery</span>
              <span>Directly with the seller</span>
            </div>
          </li>
        </ol>
      </section>

      <section className={`flex flex-col gap-4 rounded-2xl bg-white p-6 ${shadow}`}>
        <h2 className="text-xl leading-7 font-bold">Request #OL-{order.number}</h2>
        {order.lines.map((l) => (
          <div key={l.id} className="flex items-center gap-3">
            <ImagePlaceholder label="" className="size-12 shrink-0 rounded-lg [&_svg]:size-6" />
            <div className="flex min-w-0 flex-1 flex-col gap-1 text-base leading-6">
              <span className="font-bold">{l.name}</span>
              <span className="text-[var(--ollo-ink-500)]">
                {[
                  ...(l.options as { name: string; value: string }[]).map(
                    (o) => `${o.name} ${o.value}`,
                  ),
                  `qty ${l.quantity}`,
                ].join(", ")}
              </span>
            </div>
            <span className="text-base leading-6 font-bold">
              {formatRandCompact(l.unitPriceCents * l.quantity)}
            </span>
          </div>
        ))}
        <div className="h-px bg-[#d5dde3]" />
        <div className="flex items-center gap-4 text-base leading-6">
          <span className="flex-1 text-[var(--ollo-ink-500)]">
            {order.method === "delivery" ? "Delivery" : "Collection"}
          </span>
          <span className="font-bold">{when}</span>
        </div>
        <div className="flex items-center gap-4 text-base leading-6 font-bold">
          <span className="flex-1">Total</span>
          <span>{formatRandCompact(order.totalCents)}</span>
        </div>
      </section>

      <div className="flex flex-col gap-3">
        <Link
          href={`/${seller.handle}`}
          className="flex h-12 items-center justify-center rounded-xl bg-[var(--ollo-mint-500)] px-6 text-base leading-6 font-bold text-[var(--ollo-teal-900)]"
        >
          Continue shopping
        </Link>
        {contact ? (
          <a
            href={contact.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-[var(--ollo-teal-700)] bg-white px-6 text-base leading-6 font-bold text-[var(--ollo-teal-700)]"
          >
            <ChatIcon size={24} />
            Message {seller.displayName}
          </a>
        ) : null}
      </div>
    </BuyerPage>
  );
}

export default function RequestedPage(props: PageProps<"/[handle]/orders/[token]/requested">) {
  return (
    <Suspense fallback={<BuyerSkeleton />}>
      <RequestedContent params={props.params} />
    </Suspense>
  );
}
