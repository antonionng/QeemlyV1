import Link from "next/link";
import clsx from "clsx";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

export type MarketingCtaIntent = "pilot" | "demo";
export type MarketingCtaSize = "md" | "lg";
export type MarketingCtaTone = "dark" | "light";

type MarketingCtaStyleOptions = {
  intent: MarketingCtaIntent;
  size?: MarketingCtaSize;
  tone?: MarketingCtaTone;
  glow?: boolean;
  fullWidth?: boolean;
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap leading-none transition-colors transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5c45fd]";

const sizeClasses: Record<MarketingCtaSize, string> = {
  md: "h-14 !px-8 !text-[1rem] tracking-[0.02em]",
  lg: "h-16 !px-10 !text-[1.125rem] tracking-[0.02em]",
};

export function marketingCtaClasses({
  intent,
  size = "lg",
  tone = "dark",
  glow,
  fullWidth,
}: MarketingCtaStyleOptions): string {
  const intentClasses =
    intent === "pilot"
      ? "!bg-[#28e7c5] !text-[#111233] border-0 hover:!bg-[#1fd5b5]"
      : tone === "dark"
        ? "border-2 !border-white !bg-transparent !text-white hover:!bg-white/10"
        : "border-2 !border-[#111233] !bg-transparent !text-[#111233] hover:!bg-[#111233]/5";

  return clsx(
    baseClasses,
    sizeClasses[size],
    intentClasses,
    glow && "shadow-[0_0_52px_rgba(40,231,197,0.7),-8px_16px_31px_rgba(17,18,51,0.3)]",
    fullWidth && "w-full",
  );
}

type MarketingDemoLinkProps = MarketingCtaStyleOptions & {
  href: string;
  children?: ReactNode;
  className?: string;
};

export function MarketingDemoLink({
  href,
  size = "lg",
  tone = "dark",
  fullWidth,
  className,
  children = "Book a demo",
}: Omit<MarketingDemoLinkProps, "intent">) {
  return (
    <Link
      href={href}
      data-cta-intent="demo"
      data-cta-size={size}
      data-cta-tone={tone}
      className={clsx(
        marketingCtaClasses({ intent: "demo", size, tone, fullWidth }),
        className,
      )}
    >
      {children}
      <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
    </Link>
  );
}
