import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PilotApplicationModal } from "@/components/marketing/pilot-application-modal";

type HomeHeroProps = {
  header?: ReactNode;
};

export function HomeHero({ header }: HomeHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_left_top,_rgba(92,69,253,1),_rgba(92,69,253,0)_28%),linear-gradient(90deg,#111233_0%,#111233_100%)] text-white lg:min-h-[53.125rem] xl:min-h-[57.25rem]">
      {header}

      <div className="mx-auto grid w-full max-w-[90.25rem] gap-0 px-6 pb-0 pt-6 sm:px-10 lg:grid-cols-[minmax(0,39rem)_minmax(0,1fr)] lg:px-0 lg:pt-6 xl:grid-cols-[44.5625rem_44.5625rem]">
        <div className="flex max-w-[44.5625rem] flex-col justify-center pb-10 pt-8 lg:h-[46.125rem] lg:pb-0 lg:pt-[6.5rem] xl:h-[50.5rem] xl:pt-[7.5rem]">
          <div className="px-0 lg:pl-[4.5rem] lg:pr-8">
            <h1 className="max-w-[35.5625rem] text-[2.75rem] font-medium leading-[1.2] tracking-[-0.05em] text-white sm:text-[3.25rem] lg:text-[3.5rem]">
            Build a culture of trust with transparent UAE pay data
            </h1>
            <p className="mt-6 max-w-[35.5625rem] text-[1.125rem] leading-[1.5] text-[#fffdfd]">
              Qeemly replaces payroll guesswork with a live, data-backed platform, giving you the real-time
              benchmarks needed to build a fair, high-performing organization with total certainty
            </p>
            <div className="mt-12 flex flex-wrap gap-3">
              <PilotApplicationModal
                sourceCta="hero"
                triggerClassName="h-16 rounded-full !bg-[#28e7c5] !px-10 !text-[1.125rem] !font-semibold !tracking-[0.02em] !text-[#111233]"
              />
              <Link href="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-16 rounded-full border-2 !border-white/85 !bg-transparent !px-10 !text-[1.125rem] !font-semibold !tracking-[0.02em] !text-white hover:!bg-white/10 hover:!text-white"
                >
                  Book a demo
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="relative min-h-[32rem] overflow-visible lg:h-[46.125rem] xl:h-[50.5rem]">
          <Image
            src="/images/marketing/home/hero-figure.png"
            alt="Qeemly compensation intelligence preview"
            width={958}
            height={1080}
            priority
            className="absolute bottom-0 lg:right-[-4.5rem] lg:w-[46rem] xl:right-[-9rem] xl:w-[53.125rem] 2xl:right-[-10rem] h-full max-w-none"
          />
        </div>
      </div>
    </section>
  );
}
