"use client";

import clsx from "clsx";
import { ArrowRight, CheckCircle2, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import {
  ServiceDemoModalContent,
  ServiceDemoPreview,
  type ServiceDemoId,
} from "@/components/marketing/home/service-demo-modal-content";
import { SectionModal } from "@/components/ui/section-modal";

type ServiceItem = {
  id: ServiceDemoId;
  title: string;
  body: string;
  detailPoints: string[];
  modalTitle: string;
  modalSubtitle: string;
};

const serviceItems: ServiceItem[] = [
  {
    id: "benchmarking",
    title: "Real-Time Salary Benchmarking",
    body: "Stop guessing market rates and start making competitive offers backed by actual market evidence.",
    detailPoints: ["Market-backed offer guidance", "Fresh UAE benchmark ranges", "Board-ready output"],
    modalTitle: "Benchmark report",
    modalSubtitle: "Live salary ranges and export-ready output, shown in a product-style benchmark surface.",
  },
  {
    id: "salary-reviews",
    title: "Automated Salary Reviews",
    body: "Align managers, finance and HR around one source of truth for pay decisions.",
    detailPoints: ["Manager calibration workflows", "Confidence scoring on recommendations", "Clear approval-ready rationale"],
    modalTitle: "AI Distribution Review",
    modalSubtitle: "A static demo of the real salary review modal pattern used inside the product.",
  },
  {
    id: "compliance-equity",
    title: "Localised Compliance & Equity",
    body: "Keep UAE-specific fairness signals visible before risks become cultural or retention issues.",
    detailPoints: ["Select default jurisdictions", "Pay-gap signals before escalation", "Transparent fairness guardrails"],
    modalTitle: "Compliance settings workspace",
    modalSubtitle: "A real app-inspired compliance flow showing localisation controls and follow-up context.",
  },
];

export function HomeServicesShowcase() {
  const [activeServiceId, setActiveServiceId] = useState<ServiceDemoId>("benchmarking");
  const activeService = useMemo(
    () => serviceItems.find((service) => service.id === activeServiceId) ?? serviceItems[0],
    [activeServiceId],
  );

  const activeIndex = serviceItems.findIndex((service) => service.id === activeServiceId);
  const goToOffset = (offset: number) => {
    const next = (activeIndex + offset + serviceItems.length) % serviceItems.length;
    setActiveServiceId(serviceItems[next].id);
  };

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto grid w-full max-w-[90rem] grid-cols-1 gap-10 px-4 sm:px-10 lg:grid-cols-[minmax(0,38.75rem)_minmax(0,44.25rem)] lg:px-20">
        <div className="max-w-full px-0 lg:max-w-[38.75rem] lg:px-10">
          <div className="flex items-center justify-between gap-4 pb-6 pt-1">
            <h2 className="text-[1.5rem] font-semibold leading-[1.3] text-[#111233] sm:text-[2rem] sm:leading-[1.4] lg:text-[2.25rem]">See how Qeemly works</h2>
            <div className="flex items-center gap-2 lg:hidden">
              <button
                type="button"
                aria-label="Previous service"
                data-testid="services-prev"
                onClick={() => goToOffset(-1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f5f5] p-2 text-[#111233] hover:bg-[#ebebeb]"
              >
                <ChevronRight aria-hidden="true" className="h-5 w-5 rotate-180" />
              </button>
              <button
                type="button"
                aria-label="Next service"
                data-testid="services-next"
                onClick={() => goToOffset(1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f5f5] p-2 text-[#111233] hover:bg-[#ebebeb]"
              >
                <ChevronRight aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="border-y border-[rgba(150,151,153,0.2)]">
            {serviceItems.map((item) => {
              const isActive = item.id === activeServiceId;
              return (
                <article
                  key={item.id}
                  className={clsx(
                    "border-b border-[rgba(150,151,153,0.2)] last:border-b-0 py-6",
                    isActive && "lg:py-10",
                  )}
                >
                  <button
                    id={`${item.id}-trigger`}
                    type="button"
                    aria-expanded={isActive}
                    aria-controls={`${item.id}-panel`}
                    className="flex w-full items-start justify-between gap-4 text-left"
                    onClick={() => setActiveServiceId(item.id)}
                  >
                    <span
                      className={clsx(
                        "max-w-[31.75rem] text-[1.5rem] leading-[1.2] sm:text-[1.875rem] lg:text-[2.25rem]",
                        isActive ? "font-semibold text-[#5c45fd]" : "font-medium text-[#111233]",
                      )}
                    >
                      {item.title}
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className={clsx(
                        "mt-2 h-7 w-7 transition-transform duration-200 sm:h-8 sm:w-8",
                        isActive ? "translate-x-1 text-[#5c45fd]" : "text-[#111233]",
                      )}
                    />
                  </button>
                  <div
                    id={`${item.id}-panel`}
                    role="region"
                    aria-labelledby={`${item.id}-trigger`}
                    aria-label={`${item.title} details`}
                    hidden={!isActive}
                    className={clsx("hidden", isActive && "lg:block lg:pt-5")}
                  >
                    {isActive ? (
                      <>
                        <p className="max-w-[21.5rem] text-base leading-[1.5] text-[#111233]">{item.body}</p>
                        <div className="mt-5 grid gap-3">
                          {item.detailPoints.map((point) => (
                            <div
                              key={point}
                              className="flex items-center gap-3 rounded-[1.25rem] border border-[rgba(92,69,253,0.12)] bg-[rgba(92,69,253,0.04)] px-4 py-3"
                            >
                              <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-[#5c45fd]" />
                              <span className="text-sm font-medium leading-[1.4] text-[#111233]">{point}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-5">
                          <SectionModal
                            title={item.modalTitle}
                            subtitle={item.modalSubtitle}
                            triggerLabel="Get Early Access"
                            triggerVariant="button"
                            maxWidthClassName="max-w-5xl"
                          >
                            <ServiceDemoModalContent serviceId={item.id} />
                          </SectionModal>
                        </div>
                      </>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>

          <div
            id={`${activeService.id}-mobile-panel`}
            role="region"
            aria-labelledby={`${activeService.id}-trigger`}
            aria-label={`${activeService.title} details`}
            className="mt-8 lg:hidden"
          >
            <p className="max-w-[21.5rem] text-base leading-[1.5] text-[#111233]">{activeService.body}</p>
            <div className="mt-5 grid gap-3">
              {activeService.detailPoints.map((point) => (
                <div
                  key={point}
                  className="flex items-center gap-3 rounded-[1.25rem] border border-[rgba(92,69,253,0.12)] bg-[rgba(92,69,253,0.04)] px-4 py-3"
                >
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-[#5c45fd]" />
                  <span className="text-sm font-medium leading-[1.4] text-[#111233]">{point}</span>
                </div>
              ))}
            </div>
            <div className="mt-5">
              <SectionModal
                key={`mobile-${activeService.id}`}
                title={activeService.modalTitle}
                subtitle={activeService.modalSubtitle}
                triggerLabel="Get Early Access"
                triggerVariant="button"
                maxWidthClassName="max-w-5xl"
              >
                <ServiceDemoModalContent serviceId={activeService.id} />
              </SectionModal>
            </div>
            <div className="mt-8">
              <ServiceDemoPreview serviceId={activeService.id} />
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <ServiceDemoPreview serviceId={activeService.id} />
        </div>
      </div>
    </section>
  );
}
