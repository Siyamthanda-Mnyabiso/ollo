/** Shown while a buyer page loads, so a click gets an answer straight away instead of a blank screen. */
export function BuyerSkeleton() {
  return (
    <div className="flex flex-col bg-white" aria-busy="true" aria-label="Loading">
      <div className="flex h-16 items-center border-b border-[#d5dde3] px-4 md:h-20 md:px-16">
        <div className="size-10 animate-pulse rounded-full bg-[#d3f6e7]" />
      </div>
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-4 py-12 md:gap-8 md:px-16">
        <div className="h-40 animate-pulse rounded-2xl bg-[#d3f6e7] md:h-60" />
        <div className="h-16 w-2/3 animate-pulse rounded-xl bg-[#ebfbf4]" />
        <div className="h-40 animate-pulse rounded-xl bg-[#ebfbf4]" />
      </div>
    </div>
  );
}
