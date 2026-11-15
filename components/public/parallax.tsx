"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

/*
 * Hero parallax: layers move by different amounts as the page scrolls (the back layer least, the
 * foreground most). Scroll only, no mouse response. Only transform is animated, at half strength on
 * phones, and none of it runs when the visitor has asked for reduced motion.
 */

/** True when the visitor has asked for reduced motion. Server and first render say false. */
export function useReduceMotion(): boolean {
  return useSyncExternalStore(
    (notify) => {
      const q = window.matchMedia("(prefers-reduced-motion: reduce)");
      q.addEventListener("change", notify);
      return () => q.removeEventListener("change", notify);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

function useStrength() {
  const [strength, setStrength] = useState(1);
  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 767px)");
    const update = () => setStrength(narrow.matches ? 0.5 : 1);
    update();
    narrow.addEventListener("change", update);
    return () => narrow.removeEventListener("change", update);
  }, []);
  return strength;
}

const SCROLL_RANGE = 900;

/** One layer. `scroll` is how far it moves per pixel scrolled: positive lags the page, negative runs ahead. */
export function ParallaxLayer({
  scroll,
  className,
  children,
}: {
  scroll: number;
  className?: string;
  children: ReactNode;
}) {
  const reduce = useReduceMotion();
  const strength = useStrength();
  const { scrollY } = useScroll();
  const y = useTransform(
    scrollY,
    (v) => Math.min(Math.max(v, 0), SCROLL_RANGE) * scroll * strength,
  );

  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} style={{ y, willChange: "transform" }}>
      {children}
    </motion.div>
  );
}
