import Link from "next/link";
import type { ComponentType } from "react";
import {
  BankIcon,
  CardIcon,
  ChatIcon,
  LinkIcon,
  ShieldIcon,
  WalletIcon,
} from "@/components/public/figma-icons";
import { PRICING } from "@/lib/public/pages";

type Icon = ComponentType<{ size?: number }>;
const FREE_ICONS: Icon[] = [LinkIcon, CardIcon, ChatIcon];
const PRO_ICONS: Icon[] = [WalletIcon, BankIcon, ShieldIcon];

function Plan({ index }: { index: 0 | 1 }) {
  const plan = PRICING.plans[index]!;
  const pro = index === 1;
  const icons = pro ? PRO_ICONS : FREE_ICONS;
  const divider = pro ? "border-[#0a5a56]" : "border-[#d5dde3]";
  return (
    <div
      className={`flex flex-col gap-6 rounded-[32px] p-6 md:p-10 ${pro ? "bg-[var(--ollo-teal-900)] text-white" : "bg-white"}`}
    >
      <p className={`font-bold ${pro ? "text-[#00c781]" : "text-[#007a4d]"}`}>{plan.label}</p>
      <div className="flex flex-col gap-2">
        <h2 className="text-[28px] leading-[39px] font-bold">{plan.name}</h2>
        <p
          className={
            pro
              ? "text-[40px] leading-[48px] font-bold md:text-[32px] md:leading-10"
              : "text-[40px] leading-[48px] font-bold md:text-[56px] md:leading-[62px]"
          }
        >
          {plan.price}
        </p>
      </div>
      <ul className={`border-t ${divider}`}>
        {plan.lines.map((line, i) => {
          const Icon = icons[i]!;
          return (
            <li key={line} className={`flex items-center gap-4 border-b py-4 ${divider}`}>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#00c781] text-[var(--ollo-teal-900)]">
                <Icon size={24} />
              </span>
              <span className="font-bold">{line}</span>
            </li>
          );
        })}
      </ul>
      <Link
        href="/sign-in"
        className={`inline-flex items-center justify-center self-start rounded-full px-8 font-bold whitespace-nowrap ${
          pro
            ? "h-[60px] border-2 border-white text-white"
            : "h-14 bg-[var(--ollo-teal-900)] text-white"
        }`}
      >
        {plan.button}
      </Link>
    </div>
  );
}

export function PricingBody() {
  const t = PRICING.table;
  const row = "flex flex-wrap items-center justify-between gap-x-4 px-3 py-3 md:px-4 md:py-4";
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <Plan index={0} />
        <Plan index={1} />
      </div>
      <section className="flex flex-col gap-6">
        <h2 className="text-[32px] leading-[38px] font-bold md:text-[40px] md:leading-[48px]">
          {t.title}
        </h2>
        <div className="rounded-3xl bg-white p-4 md:p-6">
          <div className={`${row} text-[var(--ollo-ink-500)]`}>
            <span>{t.head[0]}</span>
            <span>{t.head[1]}</span>
          </div>
          {t.rows.map((r) => (
            <div key={r.name} className="border-t border-[#d5dde3]">
              <div className={row}>
                <span className="font-bold">{r.name}</span>
                <span
                  className={r.strong ? "font-bold text-[#007a4d]" : "text-[var(--ollo-ink-500)]"}
                >
                  {r.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
