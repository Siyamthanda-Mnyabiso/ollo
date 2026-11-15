"use client";

import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import { PrimaryLink } from "@/components/public/page-shell";
import { HELP } from "@/lib/public/pages";

export function HelpBody() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = HELP.questions.filter((x) => !q || x.question.toLowerCase().includes(q));
  return (
    <div className="flex max-w-[760px] flex-col gap-8">
      <label className="flex items-center gap-3 rounded-2xl bg-white p-4">
        <Search className="size-6 shrink-0" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={HELP.searchLabel}
          aria-label={HELP.searchLabel}
          className="w-full bg-transparent outline-none"
        />
      </label>
      <ul className="flex flex-wrap gap-6" aria-label="Topics">
        {HELP.tabs.map((tab, i) => (
          <li
            key={tab}
            className={`border-b-2 pb-1 ${i === 0 ? "border-[#007a4d] font-bold" : "border-transparent"}`}
          >
            {tab}
          </li>
        ))}
      </ul>
      <div className="divide-y divide-[#d5dde3] rounded-3xl bg-white p-4">
        {shown.length === 0 ? <p className="p-4">No questions match your search.</p> : null}
        {shown.map((item) => (
          <div key={item.question} className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold">{item.question}</h2>
              {item.answer ? (
                <ChevronDown className="size-6 shrink-0" aria-hidden="true" />
              ) : (
                <ChevronRight className="size-6 shrink-0" aria-hidden="true" />
              )}
            </div>
            {item.answer ? <p>{item.answer}</p> : null}
          </div>
        ))}
      </div>
      <div className="flex flex-col items-start gap-3 rounded-3xl bg-[var(--ollo-mint-50)] p-8">
        <h2 className="text-2xl font-bold">{HELP.stillNeedHelp.title}</h2>
        <p>{HELP.stillNeedHelp.body}</p>
        <PrimaryLink href="/contact">{HELP.stillNeedHelp.button}</PrimaryLink>
      </div>
    </div>
  );
}
