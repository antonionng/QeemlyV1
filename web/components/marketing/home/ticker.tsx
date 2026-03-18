const tickerItems = ["Founders", "HR", "Finance", "Managers"];

export function HomeTicker() {
  return (
    <section className="relative z-10 lg:-mt-[4.125rem] lg:h-[9.75rem] xl:-mt-[4.5rem] xl:h-[10.5rem] overflow-hidden bg-transparent">
      <div className="absolute lg:left-[-3rem] xl:left-[-4.625rem] top-0 flex lg:h-[9.75rem] xl:h-[10.5rem] lg:w-[calc(100vw+8rem)] xl:w-[calc(100vw+14rem)] lg:min-w-[92rem] xl:min-w-[108rem] items-center justify-center">
        <div className="w-full lg:rotate-[1.75deg] xl:rotate-[2deg]">
          <div className="home-ticker-track flex w-max min-w-full items-center justify-center gap-8 bg-[#5c45fd] lg:px-6 lg:pt-5 lg:pb-6 xl:gap-10 xl:px-8 xl:pt-6 xl:pb-7 lg:text-[1.625rem] xl:text-[1.875rem] text-white">
            {[...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems].map((item, index) => (
              <p key={`${item}-${index}`} className="mr-10 whitespace-nowrap font-medium leading-none">
                <span className="text-[#a89bff]">for</span>{" "}
                <span className="font-semibold text-white">{item}</span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
