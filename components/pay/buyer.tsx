import Link from "next/link";
import type { ReactNode } from "react";
import { OlloLogo } from "@/components/brand/logo";
import { ChevronLeftIcon, ImageIcon } from "@/components/public/figma-icons";
import { CartButton } from "@/components/pay/cart-button";

/*
 * The pieces of the buyer pages, built from the Storefront frames in Figma: the store header, the
 * seller block, and the "Powered by Ollo" footer. Nothing here knows about carts or delivery.
 */

/** The frame's "Image" placeholder: a pale green tile with the image icon and a label. */
export function ImagePlaceholder({ label, className }: { label: string; className: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 bg-[#d3f6e7] text-base leading-6 text-[var(--ollo-teal-700)] ${className}`}
    >
      <ImageIcon size={32} />
      {label}
    </div>
  );
}

/** The seller's logo, or their first letter on teal, as in the frame's "Avatar". */
export function Avatar({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl?: string | null;
  className: string;
}) {
  return logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logoUrl} alt="" className={`shrink-0 rounded-full object-cover ${className}`} />
  ) : (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-[var(--ollo-teal-900)] font-bold text-white ${className}`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function StoreHeader({
  name,
  logoUrl,
  handle,
  backHref,
  title,
}: {
  name: string;
  logoUrl?: string | null;
  handle?: string;
  backHref?: string;
  title?: string;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-[#d5dde3] bg-white pr-2 pl-4 md:h-20 md:px-16">
      <div className="flex items-center gap-3">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Back"
            className="flex size-12 items-center justify-center text-[var(--ollo-ink-900)]"
          >
            <ChevronLeftIcon size={24} />
          </Link>
        ) : null}
        <Avatar name={name} logoUrl={logoUrl} className="size-10 text-base" />
        <p className="text-xl leading-7 font-bold text-[var(--ollo-ink-900)]">{title ?? name}</p>
      </div>
      {handle ? <CartButton handle={handle} /> : null}
    </header>
  );
}

/** Seller logo, name, bio and the Verified seller badge. */
export function SellerBlock({
  name,
  bio,
  logoUrl,
  verified,
}: {
  name: string;
  bio?: string | null;
  logoUrl?: string | null;
  verified: boolean;
}) {
  return (
    <section aria-label="Seller" className="flex items-center gap-4">
      <Avatar name={name} logoUrl={logoUrl} className="size-16 text-xl md:size-20" />
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-2xl leading-8 font-bold tracking-[-0.005em] text-[var(--ollo-ink-900)] md:text-[32px] md:leading-10">
          {name}
        </h1>
        {bio ? <p className="text-base leading-6 text-[var(--ollo-ink-500)]">{bio}</p> : null}
        {verified ? (
          <p className="flex items-center gap-2 text-base leading-6 font-bold text-[var(--ollo-ink-900)]">
            <span className="flex text-[#007a4d]">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="8" cy="8" r="6.25" />
                <path d="M5.5 8.2L7.2 9.9L10.6 6.3" />
              </svg>
            </span>
            Verified seller
          </p>
        ) : null}
      </div>
    </section>
  );
}

/** "Powered by Ollo", the report link and the address check, as in the Shop page footer. */
export function BuyerFooter({ handle, plain }: { handle: string; plain?: boolean }) {
  return (
    <footer className="px-4 py-12 text-base leading-6 text-[var(--ollo-ink-500)] md:px-16 md:py-8">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-6 md:gap-8">
        <p className="flex items-center justify-center gap-2">
          Powered by
          <OlloLogo className="h-6" />
          {plain ? null : (
            <a
              href={`mailto:hello@ollopay.co.za?subject=${encodeURIComponent(`Report pay page ${handle}`)}`}
            >
              Report this pay page
            </a>
          )}
        </p>
        {plain ? null : <p>Always check the address is ollopay.co.za</p>}
      </div>
    </footer>
  );
}

/** The page around a buyer screen: store header, content, footer. */
export function BuyerPage({
  name,
  logoUrl,
  handle,
  backHref,
  title,
  plainFooter,
  width = 1120,
  children,
}: {
  name: string;
  logoUrl?: string | null;
  handle: string;
  backHref?: string;
  title?: string;
  plainFooter?: boolean;
  /** Width of the content column in px: 1120 by default, 720 on Cart, 560 on the order pages. */
  width?: number;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col bg-white text-[var(--ollo-ink-900)]">
      <StoreHeader
        name={name}
        logoUrl={logoUrl}
        handle={handle}
        backHref={backHref}
        title={title}
      />
      <main className="px-4 py-12 md:px-16">
        <div className="mx-auto flex w-full flex-col gap-6 md:gap-8" style={{ maxWidth: width }}>
          {children}
        </div>
      </main>
      <BuyerFooter handle={handle} plain={plainFooter} />
    </div>
  );
}
