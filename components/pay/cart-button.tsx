"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { CartIcon } from "@/components/public/figma-icons";

/** The cart is kept in the browser, per seller: a list of { itemId, quantity }. */
export const cartKey = (handle: string) => `ollo-cart-${handle}`;

export interface CartLine {
  itemId: string;
  name: string;
  priceCents: number;
  length: string;
  quantity: number;
}

/** The raw stored text, so useSyncExternalStore gets a value that compares equal between reads. */
export function readCartRaw(handle: string): string {
  try {
    return localStorage.getItem(cartKey(handle)) ?? "[]";
  } catch {
    return "[]";
  }
}

export function parseCart(raw: string): CartLine[] {
  try {
    const v = JSON.parse(raw) as CartLine[];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function writeCart(handle: string, lines: CartLine[]) {
  try {
    localStorage.setItem(cartKey(handle), JSON.stringify(lines));
    window.dispatchEvent(new Event("ollo-cart"));
  } catch {
    // Storage can be blocked; the cart then stays as it was.
  }
}

export function subscribeCart(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("ollo-cart", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("ollo-cart", onChange);
  };
}

function readCount(handle: string) {
  try {
    const lines = JSON.parse(localStorage.getItem(cartKey(handle)) ?? "[]") as {
      quantity: number;
    }[];
    return lines.reduce((n, l) => n + (Number(l.quantity) || 0), 0);
  } catch {
    return 0;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("ollo-cart", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("ollo-cart", onChange);
  };
}

/** "Cart (2)" on a desktop, just the count next to the icon on a phone, as in the Store header. */
export function CartButton({ handle }: { handle: string }) {
  const count = useSyncExternalStore(
    subscribe,
    () => readCount(handle),
    () => 0,
  );
  return (
    <Link
      href={`/${handle}/cart`}
      className="flex h-12 items-center gap-2 px-3 text-base leading-6 font-bold text-[var(--ollo-teal-700)] md:px-4"
    >
      <CartIcon size={24} />
      <span className="md:hidden">{count}</span>
      <span className="hidden md:inline">Cart ({count})</span>
    </Link>
  );
}
