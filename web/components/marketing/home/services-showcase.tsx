import Image from "next/image";
import { ArrowRight } from "lucide-react";

const serviceItems = [
  {
    title: "Real-Time Salary Benchmarking",
    body: "Stop guessing market rates and start making competitive offers backed by actual market evidence.",
    active: true,
  },
  {
    title: "Automated Salary Reviews",
    body: "Align managers, finance and HR around one source of truth for pay decisions.",
    active: false,
  },
  {
    title: "Localised Compliance & Equity",
    body: "Keep UAE-specific fairness signals visible before risks become cultural or retention issues.",
    active: false,
  },
];

function TableVisual() {
  return (
    <div className="relative min-h-[32rem] overflow-hidden rounded-bl-[2.5rem] rounded-tl-[2.5rem] bg-[radial-gradient(circle_at_26%_84%,_rgba(92,69,253,1),_rgba(92,69,253,0)_24%),linear-gradient(90deg,#a89bff_0%,#a89bff_100%)] pt-10 shadow-[0_24px_64px_rgba(17,18,51,0.12)] lg:min-h-[50rem]">
      <div className="absolute left-0 top-0 h-[87.5%] w-full rounded-[2rem]" />
      <Image
        src="/images/marketing/home/services-table.png"
        alt="Salary level table"
        width={881}
        height={328}
        className="absolute left-[6.5%] top-[19.75%] z-10 h-auto w-[88%] max-w-[55.0625rem] shadow-[-8px_16px_31px_8px_rgba(17,18,51,0.3)]"
      />
      <Image
        src="/images/marketing/home/services-chart.png"
        alt="Box and whisker salary chart"
        width={837}
        height={238}
        className="absolute left-[25%] top-[50.5%] z-20 h-auto w-[84%] max-w-[52.3125rem] shadow-[-8px_16px_31px_8px_rgba(17,18,51,0.3)]"
      />
    </div>
  );
}

export function HomeServicesShowcase() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto grid w-full max-w-[90rem] gap-10 px-6 sm:px-10 lg:grid-cols-[minmax(0,38.75rem)_minmax(0,44.25rem)] lg:px-20">
        <div className="max-w-[38.75rem] px-0 lg:px-10">
          <div className="pb-6 pt-1">
            <h2 className="text-[2rem] font-semibold leading-[1.4] text-[#111233] sm:text-[2.25rem]">See how Qeemly works</h2>
          </div>

          <div className="border-y border-[rgba(150,151,153,0.2)]">
            {serviceItems.map((item) => (
              <article
                key={item.title}
                className={`border-b border-[rgba(150,151,153,0.2)] ${item.active ? "py-14" : "py-6"} last:border-b-0`}
              >
                <div className="flex items-start justify-between gap-4">
                  <h3
                    className={`max-w-[31.75rem] text-[2.25rem] leading-[1.2] ${
                      item.active ? "font-semibold text-[#5c45fd]" : "font-medium text-[#111233]"
                    }`}
                  >
                    {item.title}
                  </h3>
                  <ArrowRight className={`mt-2 h-8 w-8 ${item.active ? "text-[#5c45fd]" : "text-[#111233]"}`} />
                </div>
                {item.active ? (
                  <p className="mt-4 max-w-[20.625rem] text-base leading-[1.5] text-[#111233]">{item.body}</p>
                ) : null}
              </article>
            ))}
          </div>
        </div>

        <TableVisual />
      </div>
    </section>
  );
}
