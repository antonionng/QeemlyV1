import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PilotApplicationModal } from "@/components/marketing/pilot-application-modal";

type BentoCard = {
  title: string;
  body: string;
  tone: "wide" | "compact" | "cta";
  imageSrc?: string;
  contentAlign?: "top" | "bottom";
};

const cards: BentoCard[] = [
  {
    title: "Starting in the UAE, expanding across the GCC.",
    body: "Global salary tools rarely reflect the structure of pay in the UAE. Qeemly benchmarks roles within the local hiring market.",
    tone: "wide",
    imageSrc: "/images/marketing/home/bento-gcc.png",
    contentAlign: "top",
  },
  {
    title: "Identify pay gaps early",
    body: "Spot disparities across nationality and role level before they become retention or culture issues.",
    tone: "wide",
    imageSrc: "/images/marketing/home/bento-pay-gaps.png",
    contentAlign: "top",
  },
  {
    title: "Salary benchmarks in seconds",
    body: "Compare pay by role, level and experience without relying on outdated salary surveys.",
    tone: "compact",
    imageSrc: "/images/marketing/home/bento-benchmarks.png",
    contentAlign: "top",
  },
  {
    title: "Build scalable pay frameworks",
    body: "Create salary bands and compensation structures that support fair and consistent growth.",
    tone: "compact",
    imageSrc: "/images/marketing/home/bento-frameworks.png",
    contentAlign: "bottom",
  },
  {
    title: "Compensation data from real companies",
    body: "Benchmark salaries using anonymised data contributed by organisations operating in the UAE tech ecosystem.",
    tone: "cta",
    contentAlign: "top",
  },
];

export function HomeBentoGrid() {
  return (
    <section className="bg-white pb-24">
      <div className="mx-auto grid w-full max-w-[90rem] gap-[1.5625rem] px-6 sm:px-10 lg:grid-cols-12 lg:px-20">
        {cards.map((card) => {
          const baseClassName =
            card.tone === "wide"
              ? "lg:col-span-6 min-h-[25.6875rem]"
              : card.tone === "cta"
                ? "lg:col-span-4 min-h-[25.6875rem]"
                : "lg:col-span-4 min-h-[25.6875rem]";

          const shellClassName =
            card.tone === "cta"
              ? "bg-[radial-gradient(circle_at_bottom_right,_rgba(92,69,253,1),_rgba(92,69,253,0)_34%),linear-gradient(90deg,#111233_0%,#111233_100%)]"
              : "bg-[#24195e]";

          return (
            <article
              key={card.title}
              className={`relative overflow-hidden rounded-[2.5rem] px-6 py-8 text-white sm:px-10 sm:py-12 ${baseClassName} ${shellClassName}`}
            >
              {card.imageSrc ? (
                <>
                  <Image
                    src={card.imageSrc}
                    alt=""
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,18,51,0.08)_0%,rgba(17,18,51,0.22)_100%)]" />
                </>
              ) : null}

              <div
                className={`relative flex h-full flex-col ${
                  card.tone === "cta"
                    ? "items-center justify-between text-center"
                    : card.contentAlign === "bottom"
                      ? "justify-end"
                      : "justify-start"
                }`}
              >
                <div className={card.tone === "cta" ? "max-w-[20.6875rem]" : "max-w-[18.75rem]"}>
                  <h2 className="text-[1.5rem] font-semibold leading-[1.2]">{card.title}</h2>
                  <p className="mt-2 text-base leading-[1.5] text-white/92">{card.body}</p>
                </div>

                {card.tone === "cta" ? (
                  <div className="mt-10">
                    <PilotApplicationModal
                      sourceCta="bento"
                      triggerClassName="h-16 rounded-full !bg-[#28e7c5] !px-10 !text-[1.125rem] !font-semibold !tracking-[0.02em] !text-[#111233] shadow-[0_0_52px_rgba(40,231,197,0.7),-8px_16px_31px_rgba(17,18,51,0.3)]"
                    />
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
