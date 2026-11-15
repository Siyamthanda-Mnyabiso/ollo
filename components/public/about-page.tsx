import { Smartphone, Store, ShieldCheck } from "lucide-react";
import { ABOUT } from "@/lib/public/pages";

const ICONS = [Store, Smartphone, ShieldCheck];

export function AboutBody() {
  return (
    <>
      <div className="grid gap-6 md:grid-cols-[448fr_648fr]">
        {/* The founders photo is an image in the design; it is not supplied yet. */}
        <div
          role="img"
          aria-label={ABOUT.photoLabel}
          className="flex min-h-[320px] items-center justify-center rounded-[32px] bg-[#d3f6e7] md:min-h-[480px]"
        >
          <span>{ABOUT.photoLabel}</span>
        </div>
        <section className="flex flex-col gap-6 rounded-[32px] bg-white p-8 md:p-10">
          <h2 className="text-xl font-bold">{ABOUT.story.title}</h2>
          <p className="text-[32px] leading-10 font-bold">{ABOUT.story.lead}</p>
          <p className="text-xl">{ABOUT.story.body}</p>
        </section>
      </div>
      <section className="flex flex-col gap-6">
        <h2 className="text-[40px] leading-[48px] font-bold">{ABOUT.beliefsTitle}</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {ABOUT.beliefs.map((b, i) => {
            const Icon = ICONS[i]!;
            return (
              <div
                key={b.title}
                className={`flex flex-col gap-6 rounded-[32px] p-8 md:p-10 ${
                  i === 0
                    ? "bg-[var(--ollo-teal-900)] text-white md:row-span-2"
                    : i === 1
                      ? "bg-white"
                      : "bg-[var(--ollo-mint-50)]"
                }`}
              >
                <span className="flex size-16 items-center justify-center rounded-full bg-[#00c781] text-[var(--ollo-teal-900)]">
                  <Icon className="size-8" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className={i === 0 ? "text-[32px] font-bold" : "text-2xl font-bold"}>
                    {b.title}
                  </h3>
                  <p className={i === 0 ? "text-xl" : ""}>{b.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
