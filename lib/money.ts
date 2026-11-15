const rand = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" });

/** 123456 -> "R1 234.56" (South African format). */
export function formatRand(cents: number): string {
  return rand.format(cents / 100);
}

const figma = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 498000 -> "R4,980.00". The dashboard designs show money this way. */
export function formatRandFigma(cents: number): string {
  return `R${figma.format(cents / 100)}`;
}

/** 131000 -> "R1,310", 131050 -> "R1,310.50". List rows in the designs drop ".00". */
export function formatRandCompact(cents: number): string {
  return cents % 100 === 0
    ? `R${figma.format(cents / 100).replace(/\.00$/, "")}`
    : formatRandFigma(cents);
}

/**
 * "120", "120.5", "1 200,50" -> integer cents. Returns null when it is not a valid amount.
 * Never uses floating point maths on the value.
 */
export function parseRandsToCents(input: string): number | null {
  const cleaned = input.trim().replace(/^R\s*/i, "").replace(/[\s ]/g, "").replace(",", ".");
  const match = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match) return null;
  const cents = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0") || "0");
  return Number.isSafeInteger(cents) ? cents : null;
}
