"use client";

import { AnimatePresence, motion } from "motion/react";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useReduceMotion } from "@/components/public/parallax";

/*
 * The search in the hero header. Pressing the icon slides a text input open inside the empty green
 * hump of the hero shape (on a phone, in the space beside the icon). It closes when the visitor
 * clicks away with nothing typed or presses Escape; with text in it, it stays open. It does not
 * search yet. Only transform and opacity are animated, and not at all with reduced motion.
 */
function useSearch() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const reduce = useReduceMotion();
  return {
    open,
    value,
    reduce,
    show() {
      setOpen(true);
    },
    change(v: string) {
      setValue(v);
    },
    blur() {
      if (!value.trim()) {
        setValue("");
        setOpen(false);
      }
    },
    escape() {
      setValue("");
      setOpen(false);
    },
  };
}

type S = ReturnType<typeof useSearch>;

/** The field: a white pill with a magnifier, mint focus ring and a clear button once there is text. */
function Field({ s, size }: { s: S; size: "desktop" | "mobile" }) {
  const motionProps = s.reduce
    ? {}
    : {
        initial: { x: "110%", opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: "110%", opacity: 0 },
        transition: { type: "spring" as const, stiffness: 420, damping: 36, mass: 0.7 },
      };
  return (
    <AnimatePresence>
      {s.open ? (
        <motion.div
          key="field"
          className={`flex w-full items-center gap-2 rounded-full bg-white pr-2 pl-3 text-[var(--ollo-teal-900)] shadow-[0_1px_2px_rgba(0,61,61,0.18)] ring-1 ring-[var(--ollo-teal-900)]/15 focus-within:ring-2 focus-within:ring-[#00c781] ${size === "desktop" ? "h-9" : "h-10"}`}
          {...motionProps}
        >
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <input
            type="text"
            role="searchbox"
            autoFocus
            aria-label="Search"
            placeholder="Search Ollo"
            value={s.value}
            onChange={(e) => s.change(e.target.value)}
            onBlur={s.blur}
            onKeyDown={(e) => {
              if (e.key === "Escape") s.escape();
            }}
            className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:font-normal placeholder:text-[var(--ollo-teal-900)]/55"
          />
          {s.value ? (
            <button
              type="button"
              aria-label="Clear search"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => s.change("")}
              className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--ollo-teal-900)]/10 hover:bg-[var(--ollo-teal-900)]/20"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

const ICON_BUTTON = "flex items-center justify-center";

/** Desktop: the icon next to "Log in" in the right tab, and the input in the green hump. */
export function DesktopHeaderSearch({ logIn }: { logIn: string }) {
  const s = useSearch();
  return (
    <>
      {/* The hump: x 1012 to 1204 of the 1392 wide hero shape. The wrapper clips the slide. */}
      <div
        className={`absolute top-0 left-[73.55%] z-10 hidden h-14 w-[10.3%] items-center overflow-hidden rounded-t-[16px] px-2 md:flex ${s.open ? "" : "pointer-events-none"}`}
      >
        <Field s={s} size="desktop" />
      </div>
      <div className="absolute top-0 right-0 z-10 hidden h-14 w-[13.5%] items-center justify-center gap-4 text-white md:flex">
        <button
          type="button"
          aria-label="Search"
          aria-expanded={s.open}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => (s.open ? s.escape() : s.show())}
          className={`${ICON_BUTTON} size-8`}
        >
          <Search className="size-6" aria-hidden="true" />
        </button>
        <Link href="/sign-in" className="font-bold">
          {logIn}
        </Link>
      </div>
    </>
  );
}

/** Phone: the icon sits beside the menu button; the input slides out to its left. */
export function MobileHeaderSearch() {
  const s = useSearch();
  return (
    <>
      <div
        className={`absolute top-4 right-[10.4rem] left-[6.5rem] z-10 flex h-11 items-center justify-end overflow-hidden md:hidden ${s.open ? "" : "pointer-events-none"}`}
      >
        <Field s={s} size="mobile" />
      </div>
      <button
        type="button"
        aria-label="Search"
        aria-expanded={s.open}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => (s.open ? s.escape() : s.show())}
        className={`${ICON_BUTTON} absolute top-4 right-[7.1rem] z-10 size-11 rounded-full bg-[var(--ollo-teal-900)] text-white md:hidden`}
      >
        <Search className="size-5" aria-hidden="true" />
      </button>
    </>
  );
}
