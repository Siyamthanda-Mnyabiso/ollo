"use client";

import { useState } from "react";
import { CartIcon, ChatIcon } from "@/components/public/figma-icons";
import { parseCart, readCartRaw, writeCart } from "@/components/pay/cart-button";
import { MinusIcon, PlusIcon } from "@/components/pay/product-icons";

/*
 * The Product page's Length chips, Quantity stepper and the two buttons, as drawn in Figma.
 * The app doesn't store item options yet, so the chip values and the 14" default are the frame's.
 */
export const FRAME_LENGTHS = ['10"', '12"', '14"', '16"'];
const DEFAULT_LENGTH = '14"';

export function ProductPurchase({
  handle,
  itemId,
  name,
  priceCents,
  contact,
}: {
  handle: string;
  itemId: string;
  name: string;
  priceCents: number;
  contact: { kind: "whatsapp" | "instagram"; href: string } | null;
}) {
  const [length, setLength] = useState(DEFAULT_LENGTH);
  const [quantity, setQuantity] = useState(1);

  function addToCart() {
    const lines = parseCart(readCartRaw(handle));
    const same = lines.find((l) => l.itemId === itemId && l.length === length);
    if (same) same.quantity += quantity;
    else lines.push({ itemId, length, quantity, name, priceCents });
    writeCart(handle, lines);
  }

  const chip = "flex h-12 items-center rounded-xl px-4 text-base leading-6 font-bold";
  const step = "flex size-12 items-center justify-center rounded-xl border border-[#849199]";
  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="text-base leading-6 font-bold">Length</p>
        <div className="flex items-center gap-2">
          {FRAME_LENGTHS.map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={l === length}
              onClick={() => setLength(l)}
              className={`${chip} ${
                l === length
                  ? "bg-[var(--ollo-teal-900)] text-white"
                  : `border border-[#849199] bg-white ${l === FRAME_LENGTHS[0] ? "text-black" : "text-[var(--ollo-ink-900)]"}`
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-base leading-6 font-bold">Quantity</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Decrease quantity"
            className={step}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <MinusIcon size={24} />
          </button>
          <span className="w-8 text-center text-xl leading-7 font-bold">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            className={step}
            onClick={() => setQuantity((q) => q + 1)}
          >
            <PlusIcon size={24} />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-2">
        <button
          type="button"
          onClick={addToCart}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--ollo-mint-500)] px-6 text-base leading-6 font-bold text-[var(--ollo-teal-900)]"
        >
          <span className="hidden md:flex">
            <CartIcon size={24} />
          </span>
          Add to cart
        </button>
        {contact ? (
          <a
            href={contact.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-[var(--ollo-teal-700)] bg-white px-6 text-base leading-6 font-bold text-[var(--ollo-teal-700)]"
          >
            <ChatIcon size={24} />
            Ask a question on {contact.kind === "whatsapp" ? "WhatsApp" : "Instagram"}
          </a>
        ) : null}
      </div>
    </>
  );
}
