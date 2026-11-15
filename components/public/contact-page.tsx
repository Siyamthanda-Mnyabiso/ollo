"use client";

import { Clock, Mail, MessageCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { CONTACT, SUPPORT_EMAIL } from "@/lib/public/pages";

const FIELD = "w-full rounded-xl border border-[#d5dde3] bg-white px-4 py-4 outline-none";

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
  return (
    <div className="grid gap-6 md:grid-cols-[672fr_424fr]">
      <form onSubmit={send} className="flex flex-col gap-5 rounded-[32px] bg-white p-8 md:p-10">
        <h2 className="text-[28px] font-bold">{f.title}</h2>
        <label className="flex flex-col gap-2 font-bold">
          {f.name.label}
          <input
            name="name"
            required
            placeholder={f.name.placeholder}
            className={`${FIELD} font-normal`}
          />
        </label>
        <label className="flex flex-col gap-2 font-bold">
          {f.email.label}
          <input
            name="email"
            type="email"
            required
            placeholder={f.email.placeholder}
            className={`${FIELD} font-normal`}
          />
        </label>
        <label className="flex flex-col gap-2 font-bold">
          <span>
            {f.phone.label} <span className="font-normal">{f.phone.optional}</span>
          </span>
          <input
            name="phone"
            type="tel"
            placeholder={f.phone.placeholder}
            className={`${FIELD} font-normal`}
          />
        </label>
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 font-bold">{f.roleLabel}</legend>
          <div className="flex flex-wrap gap-6">
            {f.roles.map((r) => (
              <label key={r} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={role === r}
                  onChange={() => setRole(r)}
                  className="size-5 accent-[#007a4d]"
                />
                {r}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex flex-col gap-2 font-bold">
          {f.message.label}
          <textarea
            name="message"
            required
            rows={4}
            placeholder={f.message.placeholder}
            className={`${FIELD} font-normal`}
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-14 items-center justify-center self-start rounded-full bg-[var(--ollo-teal-900)] px-8 font-bold text-white"
        >
          {f.button}
        </button>
      </form>
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">{CONTACT.otherWays.title}</h2>
        {[
          {
            ...CONTACT.otherWays.whatsapp,
            icon: MessageCircle,
            tone: "bg-[var(--ollo-teal-900)] text-white",
          },
          { ...CONTACT.otherWays.email, icon: Mail, tone: "bg-[var(--ollo-mint-50)]" },
          { ...CONTACT.otherWays.hours, icon: Clock, tone: "bg-white" },
        ].map(({ title, value, icon: Icon, tone }) => (
          <div key={title} className={`flex items-center gap-4 rounded-3xl p-6 ${tone}`}>
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#00c781] text-[var(--ollo-teal-900)]">
              <Icon className="size-6" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-xl font-bold">{title}</h3>
              <p>{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
