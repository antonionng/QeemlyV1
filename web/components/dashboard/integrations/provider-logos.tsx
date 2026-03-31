"use client";

import clsx from "clsx";

type Props = {
  id: string;
  label?: string;
  size?: number;
  className?: string;
};

type ProviderBrandLogo = {
  src: string;
  imgClassName?: string;
  frameClassName?: string;
};

const providerBrandLogos: Record<string, ProviderBrandLogo> = {
  slack: { src: "/images/marketing/home/slack-logo.svg", imgClassName: "h-5 w-5 object-contain" },
  teams: { src: "/images/marketing/home/microsoft-teams-logo.svg", imgClassName: "h-5 w-5 object-contain" },
  bamboohr: { src: "/images/marketing/home/bamboohr-logo.svg", imgClassName: "h-5 w-auto object-contain" },
  workday: { src: "/images/marketing/home/workday-logo.svg", imgClassName: "h-4 w-auto object-contain" },
  sap_successfactors: { src: "/images/marketing/home/sap-logo.svg", imgClassName: "h-5 w-5 object-contain" },
  hibob: { src: "/images/marketing/home/hibob-logo.svg", imgClassName: "h-5 w-5 object-contain" },
  personio: { src: "/images/marketing/home/personio-logo.svg", imgClassName: "h-4 w-auto object-contain" },
  gusto: { src: "/images/marketing/home/gusto-logo.svg", imgClassName: "h-4 w-auto object-contain" },
  rippling: { src: "/images/marketing/home/rippling-logo.svg", imgClassName: "h-4 w-auto object-contain" },
  deel: { src: "/images/marketing/home/deel-logo.svg", imgClassName: "h-5 w-5 object-contain" },
  zenhr: { src: "/images/marketing/home/zanhr-logo.svg", imgClassName: "h-5 w-5 object-contain" },
  greenhouse: { src: "/images/marketing/home/greenhouse-logo.svg", imgClassName: "h-5 w-5 object-contain" },
  lever: { src: "/images/marketing/home/lever-logo.svg", imgClassName: "h-4 w-auto object-contain" },
  workable: { src: "/images/marketing/home/workable-logo.png", imgClassName: "h-4 w-auto object-contain" },
};

function getInitials(label: string) {
  return label
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ProviderLogo({ id, label, size = 40, className }: Props) {
  const displayLabel = label ?? id.replace(/_/g, " ");
  const initials = getInitials(displayLabel);
  const brandLogo = providerBrandLogos[id];

  return (
    <div
      className={clsx(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-secondary",
        brandLogo?.frameClassName,
        className,
      )}
      style={{ width: size, height: size }}
      aria-label={brandLogo ? `${displayLabel} logo` : `${displayLabel} badge`}
    >
      {brandLogo ? (
        <img
          src={brandLogo.src}
          alt={`${displayLabel} logo`}
          className={brandLogo.imgClassName ?? "h-5 w-auto object-contain"}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
