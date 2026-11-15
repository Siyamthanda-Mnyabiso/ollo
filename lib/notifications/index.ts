export type NotificationChannel = "dashboard" | "whatsapp" | "sms";

export type NotificationKind =
  "payment_received" | "payout_landed" | "new_order" | "order_delivered";

export interface Notification {
  sellerId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  channels: NotificationChannel[];
}

export interface Notifier {
  send(notification: Notification): Promise<void>;
}

/** Logs instead of sending. Replace with a WhatsApp and dashboard notifier later. */
export class ConsoleNotifier implements Notifier {
  async send(n: Notification): Promise<void> {
    console.info(`[notify:${n.channels.join("+")}] ${n.sellerId} ${n.kind}: ${n.title}`);
  }
}

export const notifier: Notifier = new ConsoleNotifier();
