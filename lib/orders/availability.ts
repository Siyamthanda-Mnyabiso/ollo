/**
 * What a seller offers at checkout, worked out from their own delivery settings. Nothing here is a
 * default: a seller who has not set delivery or collection up offers neither.
 */
export interface DeliverySettings {
  fulfilment: string;
  collectionAddress: string | null;
  deliveryFeeCents: number | null;
  deliveryDays: number[];
  deliverySlots: string[];
}

export interface Fulfilment {
  delivery: boolean;
  collection: boolean;
}

export function fulfilmentOptions(s: DeliverySettings): Fulfilment {
  const open = s.deliveryDays.length > 0 && s.deliverySlots.length > 0;
  return {
    delivery:
      open &&
      (s.fulfilment === "delivery" || s.fulfilment === "both") &&
      s.deliveryFeeCents != null,
    collection:
      open &&
      (s.fulfilment === "collection" || s.fulfilment === "both") &&
      !!s.collectionAddress?.trim(),
  };
}

export interface OfferedDate {
  /** YYYY-MM-DD in South African time */
  value: string;
  /** "Sat 15 Nov" */
  label: string;
}

const ZA = "Africa/Johannesburg";

/** Today's date in South Africa as year, month and day. */
function zaToday(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return { y: get("year"), m: get("month"), d: get("day") };
}

/** How far ahead a buyer can pick a day. */
export const DATE_HORIZON_DAYS = 14;

/** The days from today on that the seller works, in order. */
export function offeredDates(
  s: Pick<DeliverySettings, "deliveryDays">,
  now: Date,
  count = 3,
): OfferedDate[] {
  const { y, m, d } = zaToday(now);
  const label = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const out: OfferedDate[] = [];
  for (let n = 0; n < DATE_HORIZON_DAYS && out.length < count; n++) {
    const day = new Date(Date.UTC(y, m - 1, d + n));
    if (!s.deliveryDays.includes(day.getUTCDay())) continue;
    out.push({
      value: day.toISOString().slice(0, 10),
      label: label.format(day).replace(",", ""),
    });
  }
  return out;
}

/** Every day a buyer could validly send, for checking a submitted date. */
export function isOfferedDate(
  s: Pick<DeliverySettings, "deliveryDays">,
  value: string,
  now: Date,
): boolean {
  return offeredDates(s, now, DATE_HORIZON_DAYS).some((o) => o.value === value);
}
