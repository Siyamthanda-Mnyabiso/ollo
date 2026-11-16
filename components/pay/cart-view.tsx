"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { MinusIcon, PlusIcon } from "@/components/pay/product-icons";
import { ImagePlaceholder } from "@/components/pay/buyer";
import {
  parseCart,
  readCartRaw,
  subscribeCart,
  writeCart,
  type CartLine,
} from "@/components/pay/cart-button";
import { formatRandCompact } from "@/lib/money";

/** The Cart frame: the lines, the three totals rows, "Go to checkout" and "Keep shopping". */
export function CartView({ handle }: { handle: string }) {
  const raw = useSyncExternalStore(
    subscribeCart,
    () => readCartRaw(handle),
    () => "[]",
  );
  const lines = parseCart(raw);
  const subtotal = lines.reduce((n, l) => n + l.priceCents * l.quantity, 0);

  function change(line: CartLine, by: number) {
    const next = lines
      .map((l) =>
        l.itemId === line.itemId && l.length === line.length
          ? { ...l, quantity: l.quantity + by }
          : l,
      )
      .filter((l) => l.quantity > 0);
    writeCart(handle, next);
  }

  const step = "flex size-12 items-center justify-center rounded-xl border border-[#849199]";
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(15,31,45,0.06),0_4px_12px_rgba(15,31,45,0.06)]">
      {lines.map((line) => (
        <div
          key={`${line.itemId}-${line.length}`}
          className="flex gap-4 border-b border-[#d5dde3] pb-4"
        >
          <ImagePlaceholder label="" className="size-20 shrink-0 rounded-xl" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="text-base leading-6 font-bold text-[var(--ollo-ink-900)]">{line.name}</p>
            <p className="text-base leading-6 text-[var(--ollo-ink-500)]">Length {line.length}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Decrease quantity"
                className={step}
                onClick={() => change(line, -1)}
              >
                <MinusIcon size={24} />
              </button>
              <span className="w-8 text-center text-xl leading-7 font-bold">{line.quantity}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                className={step}
                onClick={() => change(line, 1)}
              >
                <PlusIcon size={24} />
              </button>
            </div>
          </div>
          <p className="text-base leading-6 font-bold text-[var(--ollo-ink-900)]">
            {formatRandCompact(line.priceCents * line.quantity)}
          </p>
        </div>
      ))}
      {lines.length > 0 ? (
        <>
          <div className="flex items-center justify-between gap-2 text-base leading-6">
            <span className="text-[var(--ollo-ink-500)]">Subtotal</span>
            <span>{formatRandCompact(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-base leading-6">
            <span className="text-[var(--ollo-ink-500)]">Delivery</span>
            <span>Worked out at checkout</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-base leading-6 font-bold">
            <span>Total</span>
            <span>{formatRandCompact(subtotal)}</span>
          </div>
          <Link
            href={`/${handle}/checkout`}
            className="flex h-12 items-center justify-center self-stretch rounded-xl bg-[var(--ollo-mint-500)] px-6 text-base leading-6 font-bold text-[var(--ollo-teal-900)] md:self-start"
          >
            Go to checkout
          </Link>
        </>
      ) : null}
      <Link
        href={`/${handle}`}
        className="flex h-12 items-center justify-center self-stretch rounded-xl px-6 text-base leading-6 font-bold text-[var(--ollo-teal-700)] md:self-start"
      >
        Keep shopping
      </Link>
    </div>
  );
}
