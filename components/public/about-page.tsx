import type { ComponentType } from "react";
import { ImageIcon, SecureIcon, ShopfrontIcon, TapIcon } from "@/components/public/figma-icons";
import { ABOUT } from "@/lib/public/pages";

type Icon = ComponentType<{ size?: number; className?: string }>;
const ICONS: Icon[] = [ShopfrontIcon, TapIcon, SecureIcon];

function Circle({ children, big }: { children: React.ReactNode; big: boolean }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#00c781] text-[var(--ollo-teal-900)] ${big ? "size-16" : "size-14 md:size-16"}`}
    >
      {children}
    </span>
  );
}

export function AboutBody() {
  const [one, two, three] = ABOUT.beliefs as [
    (typeof ABOUT.beliefs)[number],
    (typeof ABOUT.beliefs)[number],
    (typeof ABOUT.beliefs)[number],
  ];
  const [I1, I2, I3] = ICONS as [Icon, Icon, Icon];
  return (
    <>
      <div className="grid gap-6 md:grid-cols-[448fr_648fr]">
        {/* The photo is an image in the design and has not been supplied yet. */}
        <div
          role="img"
          aria-label={ABOUT.photoLabel}
          className="flex min-h-[280px] flex-col items-center justify-center gap-2 rounded-[32px] bg-[#d3f6e7] text-[#007a4d] md:min-h-[480px]"
        >
          <ImageIcon size={32} />
          <span>{ABOUT.photoLabel}</span>
        </div>
        <section className="flex flex-col justify-center gap-6 rounded-[32px] bg-white p-6 md:min-h-[480px] md:p-10">
          <h2 className="text-xl leading-7 font-bold text-[#007a4d]">{ABOUT.story.title}</h2>
          <p className="text-2xl leading-8 font-bold md:text-[32px] md:leading-10">
            {ABOUT.story.lead}
          </p>
          <p className="text-xl leading-7 text-[var(--ollo-ink-500)]">{ABOUT.story.body}</p>
        </section>
      </div>
      <section className="flex flex-col gap-6">
        <h2 className="text-[32px] leading-[38px] font-bold md:text-[40px] md:leading-[48px]">
          {ABOUT.beliefsTitle}
        </h2>
        <div className="grid gap-6 md:min-h-[420px] md:grid-cols-2">
          <div className="flex flex-col gap-6 rounded-[32px] bg-[var(--ollo-teal-900)] p-6 md:justify-between md:p-10">
            <Circle big>
              <I1 size={32} />
            </Circle>
            <div className="flex flex-col gap-3">
              <h3 className="text-[32px] leading-[38px] font-bold text-white">{one.title}</h3>
              <p className="text-xl leading-7 text-[#d3f6e7]">{one.body}</p>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            {[
              { b: two, I: I2, tone: "bg-white" },
              { b: three, I: I3, tone: "bg-[var(--ollo-mint-50)]" },
            ].map(({ b, I, tone }) => (
              <div
                key={b.title}
                className={`flex flex-1 items-center gap-6 rounded-[32px] p-6 md:p-8 ${tone}`}
              >
                <Circle big={false}>
                  <I size={32} className="size-6 md:size-8" />
                </Circle>
                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl leading-[34px] font-bold">{b.title}</h3>
                  <p className="text-[var(--ollo-ink-500)]">{b.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
