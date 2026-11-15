import type { ComponentType } from "react";
import { CheckIcon, ClockSmallIcon, DotSmallIcon, XSmallIcon } from "@/components/dashboard/icons";

type Status = "succeeded" | "pending" | "failed" | "expired" | "refunded";

/*
 * Payment status badges, drawn like the badges in the Figma frames: a small icon and a bold word,
 * no background. Paid and Refunded are the frame's own variants. Pending uses the frame's dot
 * ("Sent" and "Processing") and Failed the frame's red cross ("Sold out"). An expired payment
 * counts as Failed.
 */
const BADGES: Record<
  Status,
  { label: string; color: string; Icon: ComponentType<{ size?: number }> }
> = {
  succeeded: { label: "Paid", color: "#007a4d", Icon: CheckIcon },
  pending: { label: "Pending", color: "#1b5fb5", Icon: DotSmallIcon },
  failed: { label: "Failed", color: "#c62828", Icon: XSmallIcon },
  expired: { label: "Failed", color: "#c62828", Icon: XSmallIcon },
  refunded: { label: "Refunded", color: "#8a5a00", Icon: ClockSmallIcon },
};

export function statusLabel(status: Status) {
  return BADGES[status].label;
}

export function StatusBadge({ status }: { status: Status }) {
  const { label, color, Icon } = BADGES[status];
  return (
    <span className="inline-flex h-6 items-center gap-2 text-base leading-6 font-bold text-[var(--ollo-ink-900)]">
      <span style={{ color }} className="flex">
        <Icon size={16} />
      </span>
      {label}
    </span>
  );
}
