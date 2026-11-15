"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { MailIcon } from "@/components/public/figma-icons";
import { CONTACT, SUPPORT_EMAIL } from "@/lib/public/pages";

const INPUT =
  "flex w-full items-center gap-3 rounded-xl border border-[#849199] bg-white p-4 focus-within:ring-2 focus-within:ring-[#00c781]";
const FIELD =
  "w-full min-w-0 bg-transparent leading-6 outline-none placeholder:text-[var(--ollo-ink-500)]";

function Field({ label, extra, children }: { label: string; extra?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex gap-2">
        <span className="font-bold">{label}</span>
        {extra ? <span className="text-[var(--ollo-ink-500)]">{extra}</span> : null}
      </span>
      {children}
    </label>
  );
}

/** There is no message inbox in the app yet, so sending opens the visitor's own email app. */
export function ContactBody() {
  const f = CONTACT.form;
  const [role, setRole] = useState<string>(f.roles[0]!);
  function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const body = [
      `Name: ${d.get("name")}`,
      `Email: ${d.get("email")}`,
      `Cellphone: ${d.get("phone") || "not given"}`,
      `I am a: ${role}`,
      "",
      String(d.get("message") ?? ""),
    ].join("\n");
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Message from the Ollo website")}&body=${encodeURIComponent(body)}`;
  }
  const tiles = [
    { ...CONTACT.otherWays.email, Icon: MailIcon, tile: "bg-[var(--ollo-mint-50)]", dark: false },
  ];
  return (
    <div className="grid gap-6 md:grid-cols-[672fr_424fr]">
      <form onSubmit={send} className="flex flex-col gap-5 rounded-[32px] bg-white p-6 md:p-10">
        <h2 className="text-[28px] leading-[39px] font-bold">{f.title}</h2>
        <Field label={f.name.label}>
          <span className={INPUT}>
            <input name="name" required placeholder={f.name.placeholder} className={FIELD} />
          </span>
        </Field>
        <Field label={f.email.label}>
          <span className={INPUT}>
            <input
              name="email"
              type="email"
              required
              placeholder={f.email.placeholder}
              className={FIELD}
            />
          </span>
        </Field>
        <Field label={f.phone.label} extra={f.phone.optional}>
          <span className={INPUT}>
            <span className="font-bold">+27</span>
            <input name="phone" type="tel" placeholder={f.phone.placeholder} className={FIELD} />
          </span>
        </Field>
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 font-bold">{f.roleLabel}</legend>
          <div className="flex flex-col gap-3 md:flex-row md:gap-6">
            {f.roles.map((r) => (
              <label key={r} className="flex cursor-pointer items-center gap-3">
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={role === r}
                  onChange={() => setRole(r)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className="flex size-6 items-center justify-center rounded-full border-2 border-[#849199] peer-checked:border-[#007a4d] peer-focus-visible:ring-2 peer-focus-visible:ring-[#00c781] peer-checked:after:size-3 peer-checked:after:rounded-full peer-checked:after:bg-[#007a4d]"
                />
                {r}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label={f.message.label}>
          <span className={`${INPUT} items-start`}>
            <textarea
              name="message"
              required
              rows={3}
              placeholder={f.message.placeholder}
              className={`${FIELD} h-[86px] resize-none`}
            />
          </span>
        </Field>
        <button
          type="submit"
          className="inline-flex h-14 items-center justify-center self-start rounded-full bg-[var(--ollo-teal-900)] px-8 font-bold text-white"
        >
          {f.button}
        </button>
      </form>
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl leading-[34px] font-bold">{CONTACT.otherWays.title}</h2>
        {tiles.map(({ title, value, Icon, tile, dark }) => (
          <div key={title} className={`flex items-center gap-4 rounded-3xl p-6 ${tile}`}>
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#00c781] text-[var(--ollo-teal-900)]">
              <Icon size={24} />
            </span>
            <div className="flex flex-col gap-1">
              <h3 className={`text-xl leading-7 font-bold ${dark ? "text-white" : ""}`}>{title}</h3>
              <p className={dark ? "text-[#d3f6e7]" : "text-[var(--ollo-ink-500)]"}>{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
