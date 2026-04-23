const tickerItems = ["Founders", "HR", "Finance", "Managers"];
const tickerSequence = [...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems];

function TickerTrack({ hidden = false }: { hidden?: boolean }) {
  return (
    <div
      data-testid={hidden ? "home-ticker-track-clone" : "home-ticker-track"}
      aria-hidden={hidden ? "true" : undefined}
      className={[
        "home-ticker-track flex min-w-max shrink-0 items-center gap-6 whitespace-nowrap bg-[#5c45fd] px-4 py-6 text-[1.25rem] text-white sm:gap-8 lg:gap-8 lg:px-6 lg:pt-5 lg:pb-6 lg:text-[1.625rem] xl:gap-10 xl:px-8 xl:pt-6 xl:pb-7 xl:text-[1.875rem]",
        hidden ? "home-ticker-seam" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {tickerSequence.map((item, index) => (
        <p key={`${hidden ? "clone" : "base"}-${item}-${index}`} className="whitespace-nowrap font-medium leading-none">
          <span className="text-[#a89bff]">for</span>{" "}
          <span className="font-semibold text-white">{item}</span>
        </p>
      ))}
    </div>
  );
}

export function HomeTicker() {
  return (
    <section className="relative z-10 -mt-[2.5rem] h-[5.625rem] overflow-hidden bg-transparent lg:-mt-[4.125rem] lg:h-[9.75rem] xl:-mt-[4.5rem] xl:h-[10.5rem]">
      <div className="absolute left-[-1rem] top-0 flex h-[5.625rem] w-[calc(100vw+2rem)] items-center justify-center lg:left-[-3rem] lg:h-[9.75rem] lg:w-[calc(100vw+8rem)] lg:min-w-[92rem] xl:left-[-4.625rem] xl:h-[10.5rem] xl:w-[calc(100vw+14rem)] xl:min-w-[108rem]">
        <div className="w-full rotate-[2deg] lg:rotate-[1.75deg] xl:rotate-[2deg]">
          <div className="home-ticker-marquee flex w-max motion-reduce:animate-none">
            <TickerTrack />
            <TickerTrack hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
