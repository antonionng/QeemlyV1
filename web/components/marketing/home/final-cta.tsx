import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PilotApplicationModal } from "@/components/marketing/pilot-application-modal";

export function HomeFinalCta() {
  return (
    <section className="bg-white pb-24">
      <div className="mx-auto w-full max-w-[90rem] px-6 sm:px-10 lg:px-20">
        <div className="overflow-hidden rounded-[2.5rem] bg-[radial-gradient(circle_at_100%_100%,_rgba(92,69,253,1),_rgba(92,69,253,0)_34%),linear-gradient(90deg,#111233_0%,#111233_100%)] px-8 py-20 text-center text-white sm:px-12 lg:px-16">
          <h2 className="text-[3.25rem] font-medium leading-none tracking-[-0.05em] sm:text-[4.5rem]">
            See it with your own data
          </h2>
          <p className="mx-auto mt-6 max-w-[39.1875rem] text-[1.125rem] leading-[1.5] text-[#fffdfd]">
            Book a demo or apply to join our pilot. The UAE finally has a compensation platform built for it.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <PilotApplicationModal
              sourceCta="final-cta"
              triggerClassName="h-16 rounded-full !bg-[#28e7c5] !px-10 !text-[1.125rem] !font-semibold !tracking-[0.02em] !text-[#111233]"
            />
            <Link href="/contact">
              <Button
                variant="outline"
                size="lg"
                className="h-16 rounded-full border-2 !border-white !bg-transparent !px-10 !text-[1.125rem] !font-semibold !tracking-[0.02em] !text-white hover:!bg-white/10 hover:!text-white"
              >
                Book a demo
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
