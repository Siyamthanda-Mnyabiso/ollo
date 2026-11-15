"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType } from "react";
import {
  BagIcon,
  BoxIcon,
  DotsIcon,
  EditIcon,
  FileIcon,
  HomeIcon,
  SettingsIcon,
} from "@/components/dashboard/icons";
import { BankIcon, WalletIcon } from "@/components/public/figma-icons";

type Icon = ComponentType<{ size?: number }>;
interface Item {
  href: string;
  label: string;
  Icon: Icon;
}

/*
 * Only pages that exist are listed. The order and the "Your pay page" heading follow the Figma
 * sidebar; the pages the design shows but the app does not have are left out.
 */
const MAIN: Item[] = [
  { href: "/dashboard", label: "Home", Icon: HomeIcon },
  { href: "/dashboard/items", label: "Items", Icon: BagIcon },
  { href: "/dashboard/payments", label: "Payments", Icon: BoxIcon },
  { href: "/dashboard/requests", label: "Payment requests", Icon: FileIcon },
  { href: "/dashboard/payouts", label: "Payouts", Icon: WalletIcon },
  { href: "/dashboard/payment-methods", label: "Payment methods", Icon: BankIcon },
  { href: "/dashboard/settings", label: "Settings", Icon: SettingsIcon },
];
const PAY_PAGE: Item[] = [
  { href: "/dashboard/appearance", label: "Pay page appearance", Icon: EditIcon },
];
/** The mobile bottom bar. Everything else is under "More". */
const TABS: Item[] = [MAIN[0]!, MAIN[2]!, MAIN[1]!, MAIN[4]!];

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

function SideLink({ item, pathname }: { item: Item; pathname: string }) {
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex h-12 items-center gap-3 rounded-xl px-4 text-base leading-6 ${
        active
          ? "bg-[var(--ollo-mint-50)] font-bold text-[var(--ollo-teal-700)]"
          : "text-[var(--ollo-ink-900)]"
      }`}
    >
      <item.Icon size={24} />
      {item.label}
    </Link>
  );
}

export function SidebarNav({ showPayPage }: { showPayPage: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Dashboard" className="flex flex-col gap-2">
      {MAIN.map((item) => (
        <SideLink key={item.href} item={item} pathname={pathname} />
      ))}
      {showPayPage ? (
        <>
          <p className="px-4 pt-6 pb-2 text-base leading-6 font-bold text-[var(--ollo-ink-500)]">
            Your pay page
          </p>
          {PAY_PAGE.map((item) => (
            <SideLink key={item.href} item={item} pathname={pathname} />
          ))}
        </>
      ) : null}
    </nav>
  );
}

export function TabBar({ showPayPage }: { showPayPage: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const more = [MAIN[3]!, MAIN[5]!, MAIN[6]!, ...(showPayPage ? PAY_PAGE : [])];
  const moreActive = more.some((m) => isActive(pathname, m.href));
  const tab = (active: boolean) =>
    `flex h-[68px] flex-1 flex-col items-center justify-center gap-1 text-base leading-6 ${
      active ? "font-bold text-[var(--ollo-teal-700)]" : "text-[var(--ollo-ink-500)]"
    }`;
  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
        />
      ) : null}
      {open ? (
        <div
          id="more-menu"
          className="fixed inset-x-0 bottom-[69px] z-40 flex flex-col gap-2 rounded-t-3xl border-t border-[#d5dde3] bg-white p-4 md:hidden"
        >
          {more.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`flex h-12 items-center gap-3 rounded-xl px-4 text-base ${
                  active
                    ? "bg-[var(--ollo-mint-50)] font-bold text-[var(--ollo-teal-700)]"
                    : "text-[var(--ollo-ink-900)]"
                }`}
              >
                <item.Icon size={24} />
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
      <nav
        aria-label="Dashboard tabs"
        className="fixed inset-x-0 bottom-0 z-40 flex h-[69px] border-t border-[#d5dde3] bg-white md:hidden"
      >
        {TABS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={isActive(pathname, item.href) ? "page" : undefined}
            className={tab(isActive(pathname, item.href))}
          >
            <item.Icon size={24} />
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="more-menu"
          onClick={() => setOpen((o) => !o)}
          className={tab(open || moreActive)}
        >
          <DotsIcon size={24} />
          More
        </button>
      </nav>
    </>
  );
}
