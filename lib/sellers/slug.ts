import { RESERVED_HANDLES } from "@/lib/handles";

/** Turns a business name into a handle candidate: "Thandi's Hair!" -> "thandis-hair". */
export function slugify(name: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30)
    .replace(/-+$/g, "");
  const padded = base.length >= 2 ? base : "seller";
  return (RESERVED_HANDLES as readonly string[]).includes(padded)
    ? `${padded}-seller`.slice(0, 30)
    : padded;
}

/** Picks the first free handle from `taken`, adding -2, -3 and so on. */
export function uniqueHandle(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base;
  for (let i = 2; i < 10_000; i++) {
    const suffix = `-${i}`;
    const candidate = `${base.slice(0, 30 - suffix.length)}${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
  throw new Error("Could not find a free handle");
}
