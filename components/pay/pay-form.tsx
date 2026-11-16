"use client";

import { useActionState, useState } from "react";
import { payNow, type PayFormState } from "@/app/(pay)/[handle]/actions";
import { keepForm } from "@/components/keep-form";
import { FieldError, FormError } from "@/components/onboarding/ui";
import { BankIcon, ImageIcon, LockIcon } from "@/components/public/figma-icons";
import type { PaymentMethod } from "@/lib/fees/config";
import { METHOD_LABELS } from "@/lib/payments/labels";
import { formatRandFigma, parseRandsToCents } from "@/lib/money";

const BANK_METHODS: PaymentMethod[] = ["payshap", "capitec_pay", "instant_eft"];
const FIELD =
  "h-12 w-full min-w-0 rounded-lg border border-[#849199] bg-white px-4 text-base text-[var(--ollo-ink-900)] outline-none placeholder:text-[var(--ollo-ink-500)] focus:ring-2 focus:ring-[var(--ollo-mint-500)]";

/** The round radio from the Figma "Radio dot": a grey ring that turns teal with a dot inside. */
function RadioDot({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
        on ? "border-[var(--ollo-teal-700)]" : "border-[#849199]"
      }`}
    >
      {on ? <span className="size-3 rounded-full bg-[var(--ollo-teal-700)]" /> : null}
    </span>
  );
}

function ItemImage({ url, className }: { url?: string | null; className: string }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className={`shrink-0 object-cover ${className}`} />
  ) : (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center bg-[#d3f6e7] text-[var(--ollo-teal-700)] ${className}`}
    >
      <ImageIcon size={24} />
    </span>
  );
}

export interface PayItem {
  id: string;
  name: string;
  priceCents: number;
  imageUrl?: string | null;
}

/**
 * The pay form, laid out like the Figma "Choose payment" frame: pay by bank and card on the left,
 * the payment summary on the right (first on a phone). The amount and the item list sit above the
 * methods when the seller has not set an amount.
 */
export function PayForm({
  handle,
  requestId,
  fixedAmountCents,
  summaryTitle,
  summarySub,
  methods,
  idempotencyKey,
  items = [],
}: {
  items?: PayItem[];
  handle: string;
  requestId?: string;
  fixedAmountCents?: number;
  /** The summary row's name when no item is chosen, such as the request's note. */
  summaryTitle: string;
  summarySub?: string;
  methods: PaymentMethod[];
  idempotencyKey: string;
}) {
  const [state, action, pending] = useActionState<PayFormState, FormData>(payNow, {});
  // Picking an item fills the amount with its price. Typing an amount clears the item.
  const [itemId, setItemId] = useState("");
  const [amount, setAmount] = useState("");
  const bank = BANK_METHODS.filter((m) => methods.includes(m));
  const hasCard = methods.includes("card");
  const [method, setMethod] = useState<PaymentMethod | "">(bank[0] ?? (hasCard ? "card" : ""));
  const chosen = items.find((i) => i.id === itemId);
  const shown = chosen ? (chosen.priceCents / 100).toFixed(2) : amount;
  const cents = requestId
    ? (fixedAmountCents ?? null)
    : chosen
      ? chosen.priceCents
      : parseRandsToCents(amount);
  const money = cents ? formatRandFigma(cents) : undefined;
  const bankSelected = method !== "" && method !== "card";
  const rowName = chosen ? chosen.name : summaryTitle;

  return (
    <form onSubmit={keepForm(action)} className="flex flex-col gap-8" noValidate>
      <input type="hidden" name="handle" value={handle} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      {requestId ? <input type="hidden" name="requestId" value={requestId} /> : null}
      {chosen ? <input type="hidden" name="item" value={chosen.id} /> : null}
      {method ? <input type="hidden" name="method" value={method} /> : null}
      <FormError message={state.error} />

      <div className="grid gap-6 lg:grid-cols-[648px_360px] lg:gap-x-8 lg:gap-y-8">
        {requestId ? null : (
          <div className="flex flex-col gap-6 lg:col-start-1 lg:row-start-1">
            <div className="flex flex-col gap-2">
              <label htmlFor="amount" className="text-base leading-6 font-bold">
                Amount
              </label>
              <div className="flex h-12 items-center gap-2 rounded-lg border border-[#849199] bg-white px-4 focus-within:ring-2 focus-within:ring-[var(--ollo-mint-500)]">
                <span aria-hidden="true" className="text-base text-[var(--ollo-ink-500)]">
                  R
                </span>
                <input
                  id="amount"
                  name={chosen ? undefined : "amount"}
                  aria-label="Amount in rand"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  value={shown}
                  onChange={(e) => {
                    setItemId("");
                    setAmount(e.target.value);
                  }}
                  className="h-full w-full min-w-0 bg-transparent text-base outline-none placeholder:text-[var(--ollo-ink-500)]"
                />
              </div>
              <FieldError messages={state.fieldErrors?.amount ?? state.fieldErrors?.item} />
            </div>
            {items.length > 0 ? (
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-3 text-base leading-6 font-bold">
                  Or choose an item{" "}
                  <span className="font-normal text-[var(--ollo-ink-500)]">(optional)</span>
                </legend>
                {items.map((i) => {
                  const on = itemId === i.id;
                  return (
                    <label
                      key={i.id}
                      className={`relative flex cursor-pointer items-center gap-4 rounded-xl bg-white p-4 ${
                        on
                          ? "border-2 border-[var(--ollo-teal-700)]"
                          : "border border-[#849199] [&]:m-px"
                      }`}
                    >
                      <input
                        type="radio"
                        name="item-choice"
                        checked={on}
                        onChange={() => setItemId(i.id)}
                        className="absolute inset-0 size-full cursor-pointer opacity-0"
                        aria-label={i.name}
                      />
                      <RadioDot on={on} />
                      <ItemImage url={i.imageUrl} className="size-16 rounded-xl" />
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="truncate text-base leading-6 font-bold">{i.name}</span>
                        <span className="text-base leading-6 text-[var(--ollo-ink-500)]">
                          {formatRandFigma(i.priceCents)}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            ) : null}
          </div>
        )}

        <section
          aria-label="Payment summary"
          className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-[0_0_0_1px_#d5dde3] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start"
        >
          <h2 className="text-xl leading-7 font-bold">Payment summary</h2>
          <div className="flex items-center gap-3">
            <ItemImage url={chosen?.imageUrl} className="size-12 rounded-lg" />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate text-base leading-6 font-bold">{rowName}</span>
              {summarySub ? (
                <span className="text-base leading-6 text-[var(--ollo-ink-500)]">{summarySub}</span>
              ) : null}
            </span>
            <span className="text-base leading-6 font-bold">{money ?? "R0.00"}</span>
          </div>
          <hr className="border-[#d5dde3]" />
          <div className="flex items-center justify-between gap-4 text-base leading-6 font-bold">
            <span>Total</span>
            <span data-testid="request-amount">{money ?? "R0.00"}</span>
          </div>
        </section>

        <div
          className={`flex flex-col gap-8 lg:col-start-1 ${requestId ? "lg:row-start-1" : "lg:row-start-2"}`}
        >
          <h2 className="text-[32px] leading-10 font-bold tracking-[-0.005em]">
            Choose how to pay
          </h2>
          <div className="flex flex-col gap-4">
            {bank.length > 0 ? (
              <fieldset
                className={`flex flex-col gap-4 rounded-2xl bg-white p-6 ${
                  bankSelected
                    ? "border-2 border-[var(--ollo-teal-700)]"
                    : "m-px border border-[#849199]"
                }`}
              >
                <legend className="sr-only">Pay by bank</legend>
                <div className="flex items-center gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--ollo-mint-50)] text-[var(--ollo-teal-700)]">
                    <BankIcon size={24} />
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="text-base leading-6 font-bold">Pay by bank</span>
                    <span className="text-base leading-6 text-[var(--ollo-ink-500)]">
                      Pay from your banking app
                    </span>
                  </span>
                </div>
                <p className="text-base leading-6 font-bold">Choose how to pay by bank</p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {bank.map((m) => {
                    const on = method === m;
                    return (
                      <label
                        key={m}
                        className={`relative flex h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl bg-white p-3 [&:last-child:nth-child(odd)]:col-span-2 md:[&:last-child:nth-child(odd)]:col-span-1 ${
                          on
                            ? "border-2 border-[var(--ollo-teal-700)]"
                            : "m-px border border-[#849199]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="method-choice"
                          checked={on}
                          onChange={() => setMethod(m)}
                          aria-label={METHOD_LABELS[m]}
                          className="absolute inset-0 size-full cursor-pointer opacity-0"
                        />
                        <span
                          aria-hidden="true"
                          className={`flex size-10 items-center justify-center rounded-full text-base font-bold ${
                            on
                              ? "bg-[var(--ollo-teal-900)] text-white"
                              : "bg-[var(--ollo-mint-50)] text-[var(--ollo-teal-700)]"
                          }`}
                        >
                          {METHOD_LABELS[m].charAt(0)}
                        </span>
                        <span className="text-base leading-6 font-bold">{METHOD_LABELS[m]}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}
            {hasCard ? (
              <>
                {bank.length > 0 ? (
                  <p className="text-base leading-6 font-bold text-[var(--ollo-ink-500)]">
                    Other ways to pay
                  </p>
                ) : null}
                <label
                  className={`relative flex cursor-pointer items-center gap-4 rounded-xl bg-white p-4 ${
                    method === "card"
                      ? "border-2 border-[var(--ollo-teal-700)]"
                      : "m-px border border-[#849199]"
                  }`}
                >
                  <input
                    type="radio"
                    name="method-choice"
                    checked={method === "card"}
                    onChange={() => setMethod("card")}
                    aria-label="Card"
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                  />
                  <RadioDot on={method === "card"} />
                  <span className="flex flex-col gap-1">
                    <span className="text-base leading-6 font-bold">Card</span>
                    <span className="text-base leading-6 text-[var(--ollo-ink-500)]">
                      Visa or Mastercard
                    </span>
                  </span>
                </label>
              </>
            ) : null}
            <FieldError messages={state.fieldErrors?.method} />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="buyerName" className="text-base leading-6 font-bold">
              Your name <span className="font-normal text-[var(--ollo-ink-500)]">(optional)</span>
            </label>
            <input id="buyerName" name="buyerName" autoComplete="name" className={FIELD} />
          </div>

          <div className="flex flex-col gap-4">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[var(--ollo-mint-500)] px-6 text-base font-bold text-[var(--ollo-teal-900)] disabled:opacity-60"
            >
              {pending ? "One moment" : money ? `Pay ${money}` : "Pay"}
            </button>
            <p className="flex items-center justify-center gap-2 text-base leading-6 text-[var(--ollo-ink-500)]">
              <LockIcon size={24} />
              Secure payment powered by Stitch
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
