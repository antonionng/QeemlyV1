"use client";

import clsx from "clsx";
import { ArrowRight, CheckCircle2 } from "lucide-react";
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

  return (
    <section className="bg-white py-24">
      <div className="mx-auto grid w-full max-w-[90rem] gap-10 px-6 sm:px-10 lg:grid-cols-[minmax(0,38.75rem)_minmax(0,44.25rem)] lg:px-20">
        <div className="max-w-[38.75rem] px-0 lg:px-10">
          <div className="pb-6 pt-1">
            <h2 className="text-[2rem] font-semibold leading-[1.4] text-[#111233] sm:text-[2.25rem]">See how Qeemly works</h2>
          </div>

          <div className="border-y border-[rgba(150,151,153,0.2)]">
            {serviceItems.map((item) => {
              const isActive = item.id === activeServiceId;
              return (
                <article
                  key={item.id}
                  className={clsx("border-b border-[rgba(150,151,153,0.2)] last:border-b-0", isActive ? "py-10" : "py-6")}
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
                        "max-w-[31.75rem] text-[2.25rem] leading-[1.2]",
                        isActive ? "font-semibold text-[#5c45fd]" : "font-medium text-[#111233]",
                      )}
                    >
                      {item.title}
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className={clsx(
                        "mt-2 h-8 w-8 transition-transform duration-200",
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
                    className={isActive ? "pt-5" : undefined}
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
        </div>

        <ServiceDemoPreview serviceId={activeService.id} />
      </div>
    </section>
  );
}
