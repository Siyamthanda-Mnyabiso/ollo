"use client";

import { useState } from "react";
import { ChevronDownIcon, SearchIcon } from "@/components/public/figma-icons";
import { PrimaryLink } from "@/components/public/page-shell";
import { HELP, helpAnswer } from "@/lib/public/pages";

export function HelpBody({ live }: { live: boolean }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = HELP.questions.filter((x) => !q || x.question.toLowerCase().includes(q));
  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-8">
      <label className="flex items-center gap-3 rounded-2xl border border-[#849199] bg-white p-4 focus-within:ring-2 focus-within:ring-[#00c781]">
        <SearchIcon size={24} className="shrink-0 text-[var(--ollo-ink-900)]" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={HELP.searchLabel}
          aria-label={HELP.searchLabel}
          className="w-full bg-transparent leading-6 outline-none placeholder:text-[var(--ollo-ink-500)]"
        />
      </label>
      <ul className="flex flex-wrap gap-6" aria-label="Topics">
        {HELP.tabs.map((tab, i) => (
          <li key={tab} className="flex flex-col gap-2">
            <span className={i === 0 ? "font-bold" : "text-[var(--ollo-ink-500)]"}>{tab}</span>
            <span className={`h-0.5 ${i === 0 ? "bg-[#007a4d]" : ""}`} />
          </li>
        ))}
      </ul>
      <div className="rounded-3xl bg-white p-2 md:p-4">
        {shown.length === 0 ? <p className="p-4">No questions match your search.</p> : null}
        {shown.map((item, i) => (
          <div key={item.question}>
            {i > 0 ? <hr className="border-[#d5dde3]" /> : null}
            <div className="flex flex-col gap-2 p-4">
              <div className="flex items-center gap-4">
                <h2 className="flex-1 text-xl leading-7 font-bold">{item.question}</h2>
                <ChevronDownIcon className="shrink-0" />
              </div>
              <p className="text-[var(--ollo-ink-500)]">{helpAnswer(item, live)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-start gap-3 rounded-3xl bg-[var(--ollo-mint-50)] p-8">
        <h2 className="text-2xl leading-[34px] font-bold">{HELP.stillNeedHelp.title}</h2>
        <p>{HELP.stillNeedHelp.body}</p>
        <PrimaryLink href="/contact">{HELP.stillNeedHelp.button}</PrimaryLink>
      </div>
    </div>
  );
}
