import { LEGAL_NOTICE, LEGAL_PLACEHOLDER, type LegalPage } from "@/lib/public/pages";

const slug = (n: number) => `section-${n + 1}`;

/**
 * Terms and Privacy share one layout, as in the Figma frames: a draft notice, a contents card and
 * numbered sections whose text is drawn as grey placeholder lines until the lawyer's wording arrives.
 */
export function LegalBody({ page }: { page: LegalPage }) {
  return (
    <>
      <div
        role="note"
        data-testid="legal-placeholder-notice"
        className="flex flex-col gap-1 rounded-3xl bg-[var(--ollo-mint-50)] p-6"
      >
        <p className="font-bold">{LEGAL_NOTICE.title}</p>
        <p>{LEGAL_NOTICE.body}</p>
      </div>
      <div className="grid gap-6 md:grid-cols-[320fr_776fr] md:items-start">
        <nav aria-label="On this page" className="flex flex-col gap-4 rounded-3xl bg-white p-6">
          <p className="text-xl leading-7 font-bold">On this page</p>
          {page.sections.map((s, i) => (
            <a
              key={s}
              href={`#${slug(i)}`}
              className={i === 0 ? "font-bold text-[#007a4d]" : "text-[var(--ollo-ink-500)]"}
            >
              {i + 1}. {s}
            </a>
          ))}
        </nav>
        <div className="flex flex-col gap-8 rounded-[32px] bg-white p-6 md:gap-8 md:p-10">
          {page.sections.map((s, i) => (
            <section key={s} id={slug(i)} className="flex scroll-mt-6 flex-col gap-3">
              <h2 className="text-2xl leading-[34px] font-bold">
                {i + 1}. {s}
              </h2>
              <p className="sr-only">{LEGAL_PLACEHOLDER}</p>
              <span aria-hidden="true" className="flex flex-col gap-3">
                <span className="h-3 rounded-md bg-[#d5dde3]" />
                <span className="h-3 rounded-md bg-[#d5dde3]" />
                <span className="h-3 w-[200px] rounded-md bg-[#d5dde3] md:w-[360px]" />
              </span>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
