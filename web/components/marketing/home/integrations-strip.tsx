import Image from "next/image";

type IntegrationLogo = {
  name: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  wrapperClassName?: string;
};

const integrations: IntegrationLogo[] = [
  {
    name: "Workable",
    src: "/images/marketing/home/workable-logo.svg",
    alt: "Workable logo",
    width: 155,
    height: 40,
    className: "h-7 w-auto max-w-none object-contain lg:h-8",
  },
  { name: "Slack", src: "/images/marketing/home/slack-logo.svg", alt: "Slack logo", width: 2448, height: 2452 },
  {
    name: "Microsoft Teams",
    src: "/images/marketing/home/microsoft-teams-logo.svg",
    alt: "Microsoft Teams logo",
    width: 2500,
    height: 2458,
  },
  { name: "Workday", src: "/images/marketing/home/workday-logo.svg", alt: "Workday logo", width: 2500, height: 1001 },
  { name: "Deel", src: "/images/marketing/home/deel-logo.svg", alt: "Deel logo", width: 2500, height: 2400 },
  {
    name: "Greenhouse",
    src: "/images/marketing/home/greenhouse-logo.svg",
    alt: "Greenhouse logo",
    width: 1269,
    height: 2500,
  },
  {
    name: "BambooHR",
    src: "/images/marketing/home/bamboohr-logo.svg",
    alt: "BambooHR logo",
    width: 180,
    height: 115,
    className: "h-11 w-auto max-w-none object-contain lg:h-12",
    wrapperClassName: "opacity-100",
  },
  {
    name: "Rippling",
    src: "/images/marketing/home/rippling-logo.svg",
    alt: "Rippling logo",
    width: 600,
    height: 450,
    className: "h-[2.625rem] w-auto max-w-none object-contain lg:h-[3rem]",
    wrapperClassName: "opacity-100",
  },
  {
    name: "Personio",
    src: "/images/marketing/home/personio-logo.svg",
    alt: "Personio logo",
    width: 842,
    height: 595,
    className: "h-[2.625rem] w-auto max-w-none object-contain lg:h-[3rem]",
    wrapperClassName: "opacity-100",
  },
  { name: "Gusto", src: "/images/marketing/home/gusto-logo.svg", alt: "Gusto logo", width: 120, height: 60 },
  { name: "Lever", src: "/images/marketing/home/lever-logo.svg", alt: "Lever logo", width: 120, height: 60 },
  { name: "HiBob", src: "/images/marketing/home/hibob-logo.svg", alt: "HiBob logo", width: 24, height: 24 },
  { name: "SAP", src: "/images/marketing/home/sap-logo.svg", alt: "SAP logo", width: 64, height: 64 },
  { name: "ZANHR", src: "/images/marketing/home/zanhr-logo.svg", alt: "ZANHR logo", width: 1000, height: 1000 },
];

function IntegrationsTrack({ hidden = false }: { hidden?: boolean }) {
  return (
    <div
      data-testid={hidden ? "integrations-track-clone" : "integrations-track"}
      aria-hidden={hidden ? "true" : undefined}
      className={[
        "home-ticker-track flex min-w-max shrink-0 items-center gap-20 whitespace-nowrap px-4 sm:gap-12 lg:gap-16",
        hidden ? "home-ticker-seam" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {integrations.map((integration) => (
        <div
          key={`${hidden ? "clone" : "base"}-${integration.name}`}
          className={[
            "flex shrink-0 items-center justify-center opacity-85 transition-opacity hover:opacity-100",
            integration.wrapperClassName ?? "",
          ]
            .filter(Boolean)
            .join(" ")}
          title={integration.name}
          data-integration-name={integration.name}
        >
          <Image
            src={integration.src}
            alt={integration.alt}
            width={integration.width}
            height={integration.height}
            className={integration.className ?? "h-10 w-auto max-w-none object-contain lg:h-11"}
            unoptimized
          />
        </div>
      ))}
    </div>
  );
}

export function HomeIntegrationsStrip() {
  return (
    <section className="overflow-hidden bg-[rgba(245,245,245,0.96)]">
      <div className="mx-auto w-full max-w-[90rem] px-4 py-20 sm:px-10 lg:px-20">
        <div className="mx-auto max-w-[39.1875rem] text-center">
          <h2 className="text-[1.5rem] font-semibold leading-[1.3] text-[#111233] sm:text-[2rem] sm:leading-[1.4] lg:text-[2.25rem]">
            Seamless HRIS Integrations
          </h2>
          <p className="mt-5 text-base leading-[1.5] text-[#111233]">
            Eliminate manual entry while ensuring all sensitive workforce data remains securely sandboxed within
            the UAE.
          </p>
        </div>

        <div className="mt-14 overflow-hidden">
          <div
            data-testid="integrations-marquee"
            className="home-ticker-marquee flex w-max min-w-full items-center motion-reduce:animate-none"
          >
            <IntegrationsTrack />
            <IntegrationsTrack hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
