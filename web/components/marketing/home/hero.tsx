import type { ReactNode } from "react";
import Image from "next/image";
import { MarketingDemoLink } from "@/components/marketing/marketing-cta-button";
import { PilotApplicationModal } from "@/components/marketing/pilot-application-modal";

type HomeHeroProps = {
  header?: ReactNode;
};

export function HomeHero({ header }: HomeHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_left_top,_rgba(92,69,253,1),_rgba(92,69,253,0)_28%),linear-gradient(90deg,#111233_0%,#111233_100%)] text-white lg:min-h-[53.125rem] xl:min-h-[57.25rem]">
      {header}

      <div className="mx-auto grid w-full max-w-[90.25rem] gap-0 px-4 pb-0 pt-2 sm:px-10 sm:pt-6 lg:grid-cols-[minmax(0,39rem)_minmax(0,1fr)] lg:px-0 lg:pt-6 xl:grid-cols-[44.5625rem_44.5625rem]">
        <div className="flex max-w-[44.5625rem] flex-col justify-center pb-0 pt-10 lg:h-[46.125rem] lg:pb-0 lg:pt-[6.5rem] xl:h-[50.5rem] xl:pt-[7.5rem]">
          <div className="px-0 lg:pl-[4.5rem] lg:pr-8">
            <h1 className="max-w-[35.5625rem] text-[2.125rem] font-medium leading-[1.2] tracking-[-0.05em] text-white sm:text-[3.25rem] lg:text-[3.5rem]">
              Build a culture of trust with transparent UAE pay data
            </h1>
            <p className="mt-6 max-w-[35.5625rem] text-base leading-[1.5] text-[#fffdfd] sm:text-[1.125rem]">
              Qeemly replaces payroll guesswork with a live, data-backed platform, giving you the real-time
              benchmarks needed to build a fair, high-performing organization with total certainty
            </p>
            <div className="mt-12 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <PilotApplicationModal
                sourceCta="hero"
                size="md"
                tone="dark"
                triggerClassName="w-[13.4375rem] sm:w-auto sm:!px-10 sm:h-16 sm:!text-[1.125rem]"
              />
              <MarketingDemoLink
                href="/contact"
                size="md"
                tone="dark"
                className="w-[13.4375rem] sm:w-auto sm:!px-10 sm:h-16 sm:!text-[1.125rem]"
              />
            </div>
          </div>
        </div>

        <div className="relative -mx-4 mt-6 sm:-mx-10 sm:mt-10 lg:mx-0 lg:mt-0 lg:h-[46.125rem] lg:w-full lg:overflow-visible xl:h-[50.5rem]">
          <Image
            src="/images/marketing/home/hero-female.png"
            alt="Qeemly compensation intelligence preview"
            width={2139}
            height={2274}
            priority
            className="block h-auto w-full max-w-none lg:absolute lg:bottom-0 lg:left-auto lg:right-[-4.5rem] lg:h-full lg:w-[46rem] xl:right-[-9rem] xl:w-[53.125rem] 2xl:right-[-10rem]"
          />
        </div>
      </div>
    </section>
  );
}
