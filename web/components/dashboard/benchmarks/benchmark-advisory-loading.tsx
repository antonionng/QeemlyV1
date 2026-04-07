"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Logo } from "@/components/logo";

type BenchmarkAdvisoryLoadingProps = {
  variant: "search" | "refresh" | "detail";
};

const COPY = {
  search: {
    eyebrow: "Qeemly Advisory AI",
    title: "Building your benchmark view",
    description:
      "We are validating the role, location, and company filters before we return the strongest market benchmark.",
    steps: [
      "Validating role, level, and market filters",
      "Pulling the strongest market benchmark for your request",
      "Preparing Qeemly Advisory AI guidance for the result view",
    ],
  },
  refresh: {
    eyebrow: "Qeemly Advisory AI",
    title: "Refreshing your benchmark",
    description:
      "We are re-running the benchmark with your latest filters so the results stay aligned with the requested market cohort.",
    steps: [
      "Refreshing the benchmark with your latest filters",
      "Comparing market cohorts and preparing the advisory",
      "Updating the result view with the latest benchmark story",
    ],
  },
  detail: {
    eyebrow: "Qeemly Advisory AI",
    title: "Preparing your detailed breakdown",
    description:
      "We are generating AI-powered insights, salary breakdowns, industry comparisons, and trend analysis for this benchmark.",
    steps: [
      "Generating AI salary bands and level comparisons",
      "Building industry, company size, and geographic breakdowns",
      "Preparing trend analysis, compensation mix, and offer guidance",
    ],
  },
} as const;

function QeemlyLoadingIcon() {
  return (
    <div
      data-testid="qeemly-loading-icon"
      className="flex h-14 min-w-14 items-center justify-center rounded-2xl border border-brand-100 bg-white px-2 shadow-[0_10px_24px_rgba(36,58,90,0.12)]"
    >
      <Logo href={null} compact className="pointer-events-none [&_img]:h-7 [&_img]:w-auto" />
    </div>
  );
}

export function BenchmarkAdvisoryLoading({
  variant,
}: BenchmarkAdvisoryLoadingProps) {
  const copy = COPY[variant];

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-brand-950/18 backdrop-blur-[3px]" aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="benchmark-advisory-loading-title"
        aria-describedby="benchmark-advisory-loading-description"
        className="relative w-full max-w-3xl overflow-hidden rounded-[28px] border border-brand-100 bg-gradient-to-br from-white via-white to-violet-50/80 shadow-[0_24px_80px_rgba(36,58,90,0.18)]"
      >
        <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6" role="status" aria-live="polite">
          <div className="flex items-start gap-3">
            <QeemlyLoadingIcon />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-600">
                {copy.eyebrow}
              </p>
              <h3
                id="benchmark-advisory-loading-title"
                className="text-lg font-semibold text-brand-900 sm:text-xl"
              >
                {copy.title}
              </h3>
              <p
                id="benchmark-advisory-loading-description"
                className="mt-1.5 max-w-2xl text-sm leading-6 text-brand-700"
              >
                {copy.description}
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {copy.steps.map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-3 rounded-2xl border border-brand-100/70 bg-white/90 px-4 py-3 shadow-[0_10px_30px_rgba(36,58,90,0.05)]"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-brand-900">{step}</p>
                </div>
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
