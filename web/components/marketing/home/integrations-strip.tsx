import Image from "next/image";

const integrations = [
  { src: "/images/marketing/home/logo-1.svg", alt: "Golsum logo", width: 155, height: 40 },
  { src: "/images/marketing/home/logo-2.svg", alt: "IPFUM logo", width: 169, height: 40 },
  { src: "/images/marketing/home/logo-3.svg", alt: "Loopsum logo", width: 160, height: 30 },
  { src: "/images/marketing/home/logo-4.svg", alt: "Looqo logo", width: 125, height: 40 },
  { src: "/images/marketing/home/logo-5.svg", alt: "Loge ipsum logo", width: 186, height: 41 },
  { src: "/images/marketing/home/logo-6.svg", alt: "Distinctly logo", width: 70, height: 44 },
  { src: "/images/marketing/home/logo-7.svg", alt: "Logobustium logo", width: 170, height: 41 },
];

export function HomeIntegrationsStrip() {
  return (
    <section className="bg-[rgba(245,245,245,0.96)]">
      <div className="mx-auto w-full max-w-[90rem] px-6 py-20 sm:px-10 lg:px-20">
        <div className="mx-auto max-w-[39.1875rem] text-center">
          <h2 className="text-[2rem] font-semibold leading-[1.4] text-[#111233] sm:text-[2.25rem]">
            Seamless HRIS Integrations
          </h2>
          <p className="mt-5 text-base leading-[1.5] text-[#111233]">
            Eliminate manual entry while ensuring all sensitive workforce data remains securely sandboxed within
            the UAE.
          </p>
        </div>

        <div className="mt-14 overflow-x-auto">
          <div className="flex min-w-max items-center gap-12 px-2 lg:gap-20">
            {integrations.map((integration) => (
              <div key={integration.alt} className="flex shrink-0 items-center justify-center opacity-85">
                <Image
                  src={integration.src}
                  alt={integration.alt}
                  width={integration.width}
                  height={integration.height}
                  className="h-auto w-auto max-w-none"
                  unoptimized
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
