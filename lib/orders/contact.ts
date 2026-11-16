/** The seller's way of being reached, from what they saved in Settings. WhatsApp wins over Instagram. */
export type Contact = { kind: "whatsapp" | "instagram"; href: string } | null;

export function contactFor(
  seller: { whatsappNumber: string | null; instagramHandle: string | null },
  message?: string,
): Contact {
  if (seller.whatsappNumber) {
    const text = message ? `?text=${encodeURIComponent(message)}` : "";
    return {
      kind: "whatsapp",
      href: `https://wa.me/${seller.whatsappNumber.replace(/\D/g, "")}${text}`,
    };
  }
  if (seller.instagramHandle) {
    return { kind: "instagram", href: `https://instagram.com/${seller.instagramHandle}` };
  }
  return null;
}
