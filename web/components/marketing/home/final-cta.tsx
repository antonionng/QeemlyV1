import { MarketingDemoLink } from "@/components/marketing/marketing-cta-button";
import { PilotApplicationModal } from "@/components/marketing/pilot-application-modal";

export function HomeFinalCta() {
  return (
    <section className="bg-white pb-24">
      <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-10 lg:px-20">
        <div className="overflow-hidden rounded-[2.5rem] bg-[radial-gradient(circle_at_100%_100%,_rgba(92,69,253,1),_rgba(92,69,253,0)_34%),linear-gradient(90deg,#111233_0%,#111233_100%)] px-6 py-20 text-center text-white sm:px-12 lg:px-16">
          <h2 className="text-[2.125rem] font-medium leading-[1.05] tracking-[-0.05em] sm:text-[3.25rem] lg:text-[4.5rem]">
            See it with your own data
          </h2>
          <p className="mx-auto mt-6 max-w-[39.1875rem] text-base leading-[1.5] text-[#fffdfd] sm:text-[1.125rem]">
            Book a demo or apply to join our pilot. The UAE finally has a compensation platform built for it.
          </p>
          <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <PilotApplicationModal
              sourceCta="final-cta"
              size="md"
              tone="dark"
              fullWidth
              triggerClassName="w-[13.4375rem] sm:w-auto sm:!px-10 sm:h-16 sm:!text-[1.125rem]"
            />
            <MarketingDemoLink
              href="/contact"
              size="md"
              tone="dark"
              fullWidth
              className="w-[13.4375rem] sm:w-auto sm:!px-10 sm:h-16 sm:!text-[1.125rem]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
