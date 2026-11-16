"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, useTransition, type FormEvent } from "react";
import { submitOrder } from "@/app/(pay)/[handle]/checkout/actions";
import { parseCart, readCartRaw, subscribeCart, writeCart } from "@/components/pay/cart-button";
import { ImageIcon } from "@/components/public/figma-icons";
import { formatRandCompact } from "@/lib/money";

/*
 * The Checkout details frame. What the seller offers (collection address, delivery fee, days and time
 * slots) comes from their delivery settings; the fee shown here is only a preview, the server works
 * the real one out again when the order is made.
 */
export interface CheckoutOptions {
  delivery: boolean;
  collection: boolean;
  collectionAddress: string | null;
  deliveryFeeCents: number;
  dates: { value: string; label: string }[];
  slots: string[];
}

const card =
  "flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(15,31,45,0.06),0_4px_12px_rgba(15,31,45,0.06)]";
const input =
  "h-12 w-full min-w-0 rounded-lg border border-[#849199] bg-white px-4 text-base leading-6 text-[var(--ollo-ink-900)] placeholder:text-[var(--ollo-ink-500)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ollo-teal-700)]";

export const checkoutKey = (handle: string) => `ollo-checkout-${handle}`;

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-base leading-6 font-bold text-[var(--ollo-ink-900)]">{label}</span>
      {hint ? <span className="text-base leading-6 text-[var(--ollo-ink-500)]">{hint}</span> : null}
      {children}
    </label>
  );
}

function Radio({
  checked,
  onSelect,
  title,
  subtitle,
  name,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  subtitle?: string;
  name: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-4 rounded-xl bg-white p-4 ${
        checked ? "border-2 border-[var(--ollo-teal-700)]" : "border border-[#849199]"
      }`}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
          checked ? "border-[var(--ollo-teal-700)]" : "border-[#849199]"
        }`}
      >
        {checked ? <span className="size-3 rounded-full bg-[var(--ollo-teal-700)]" /> : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1 text-base leading-6">
        <span className="font-bold text-[var(--ollo-ink-900)]">{title}</span>
        {subtitle ? <span className="text-[var(--ollo-ink-500)]">{subtitle}</span> : null}
      </span>
    </label>
  );
}

export function CheckoutForm({ handle, options }: { handle: string; options: CheckoutOptions }) {
  const router = useRouter();
  const raw = useSyncExternalStore(
    subscribeCart,
    () => readCartRaw(handle),
    () => "[]",
  );
  const lines = parseCart(raw);
  const [method, setMethod] = useState<"deliver" | "collect">(
    options.delivery ? "deliver" : "collect",
  );
  const [day, setDay] = useState(options.dates[0]?.value ?? "");
  const [slot, setSlot] = useState(options.slots[0] ?? "");
  const [clientKey] = useState(() => crypto.randomUUID());
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const available = options.delivery || options.collection;

  const subtotal = lines.reduce((n, l) => n + l.priceCents * l.quantity, 0);
  const delivery = method === "deliver" ? options.deliveryFeeCents : 0;

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const f = new FormData(e.currentTarget);
    setError("");
    start(async () => {
      const result = await submitOrder(handle, {
        clientKey,
        fullName: f.get("fullName"),
        phone: f.get("phone"),
        method: method === "deliver" ? "delivery" : "collection",
        street: f.get("street") || undefined,
        suburb: f.get("suburb") || undefined,
        date: day,
        slot,
        lines: lines.map((l) => ({
          itemId: l.itemId,
          quantity: l.quantity,
          options: [{ name: "Length", value: l.length }],
        })),
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      writeCart(handle, []);
      router.push(result.next);
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-6 md:grid-cols-[524px_1fr]">
      <div className="flex flex-col gap-4">
        <section className={card}>
          <h2 className="text-xl leading-7 font-bold">Your details</h2>
          <Field label="Full name">
            <input
              name="fullName"
              required
              autoComplete="name"
              placeholder="Nomsa Dlamini"
              className={input}
            />
          </Field>
          <Field label="Cellphone number" hint="The seller will contact you on WhatsApp">
            <span className="flex h-12 items-center gap-2 rounded-lg border border-[#849199] bg-white px-4 focus-within:ring-2 focus-within:ring-[var(--ollo-teal-700)]">
              <span className="text-base leading-6 text-[var(--ollo-ink-500)]">+27</span>
              <input
                name="phone"
                type="tel"
                inputMode="tel"
                required
                autoComplete="tel-national"
                placeholder="71 234 5678"
                className="h-full w-full min-w-0 bg-transparent text-base leading-6 text-[var(--ollo-ink-900)] outline-none placeholder:text-[var(--ollo-ink-500)]"
              />
            </span>
          </Field>
        </section>

        <section className={card}>
          <h2 className="text-xl leading-7 font-bold">Delivery or collection</h2>
          {options.delivery ? (
            <Radio
              name="method"
              checked={method === "deliver"}
              onSelect={() => setMethod("deliver")}
              title="Deliver to me"
              subtitle="Enter your address"
            />
          ) : null}
          {options.collection ? (
            <Radio
              name="method"
              checked={method === "collect"}
              onSelect={() => setMethod("collect")}
              title="Collect from seller"
              subtitle={options.collectionAddress ?? undefined}
            />
          ) : null}
          <Field label="Street address">
            <input
              name="street"
              required={method === "deliver"}
              autoComplete="street-address"
              placeholder="12 Long Street"
              className={input}
            />
          </Field>
          <Field label="Suburb and city">
            <input
              name="suburb"
              required={method === "deliver"}
              autoComplete="address-level2"
              placeholder="Gardens, Cape Town"
              className={input}
            />
          </Field>
        </section>

        <section className={card}>
          <h2 className="text-xl leading-7 font-bold">Delivery day and time</h2>
          <div className="flex flex-wrap items-center gap-2">
            {options.dates.map((d) => (
              <button
                key={d.value}
                type="button"
                aria-pressed={d.value === day}
                onClick={() => setDay(d.value)}
                className={`flex h-12 items-center rounded-xl px-4 text-base leading-6 font-bold ${
                  d.value === day
                    ? "bg-[var(--ollo-teal-900)] text-white"
                    : "border border-[#849199] bg-white text-[var(--ollo-ink-900)]"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          {options.slots.map((s) => (
            <Radio key={s} name="slot" checked={s === slot} onSelect={() => setSlot(s)} title={s} />
          ))}
        </section>

        {error ? (
          <p role="alert" className="text-base leading-6 text-[#c62828]">
            {error}
          </p>
        ) : null}
        {available ? null : (
          <p className="text-base leading-6 text-[var(--ollo-ink-500)]">
            This seller has not set up delivery or collection yet.
          </p>
        )}
        <button
          type="submit"
          disabled={pending || !available || lines.length === 0}
          className="flex h-12 items-center justify-center self-stretch rounded-xl bg-[var(--ollo-mint-500)] px-6 text-base leading-6 font-bold text-[var(--ollo-teal-900)] disabled:opacity-60 md:self-start"
        >
          Send order request
        </button>
      </div>

      <section className={`${card} gap-3! self-stretch`}>
        <h2 className="text-xl leading-7 font-bold">Order summary</h2>
        {lines.map((l) => (
          <div key={`${l.itemId}-${l.length}`} className="flex items-center gap-4 py-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#d3f6e7] text-[var(--ollo-teal-700)]">
              <ImageIcon size={24} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1 text-base leading-6">
              <span className="font-bold text-[var(--ollo-ink-900)]">{l.name}</span>
              <span className="text-[var(--ollo-ink-500)]">
                Length {l.length}, qty {l.quantity}
              </span>
            </span>
            <span className="text-base leading-6 font-bold">
              {formatRandCompact(l.priceCents * l.quantity)}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-2 text-base leading-6">
          <span className="flex-1 text-[var(--ollo-ink-500)]">Subtotal</span>
          <span>{formatRandCompact(subtotal)}</span>
        </div>
        <div className="flex items-center gap-2 text-base leading-6">
          <span className="flex-1 text-[var(--ollo-ink-500)]">Delivery</span>
          <span>{method === "collect" ? "Free" : formatRandCompact(delivery)}</span>
        </div>
        <div className="flex items-center gap-2 text-base leading-6 font-bold">
          <span className="flex-1">Total</span>
          <span>{formatRandCompact(subtotal + delivery)}</span>
        </div>
      </section>
    </form>
  );
}
