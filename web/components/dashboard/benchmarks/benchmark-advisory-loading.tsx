"use client";

type BenchmarkAdvisoryLoadingProps = {
  variant: "search" | "refresh";
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
} as const;

export function BenchmarkAdvisoryLoading({
  variant,
}: BenchmarkAdvisoryLoadingProps) {
  const copy = COPY[variant];

  return (
    <div
      className="rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-violet-50 px-5 py-5 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500/10">
          <div className="h-3 w-3 rounded-full bg-brand-500 animate-pulse" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-600">
            {copy.eyebrow}
          </p>
          <h3 className="text-base font-semibold text-brand-900">
            {copy.title}
          </h3>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-brand-700">
        {copy.description}
      </p>

      <div className="mt-4 space-y-2">
        {copy.steps.map((step, index) => (
          <div
            key={step}
            className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 px-4 py-3"
          >
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700"
            >
              {index + 1}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-brand-900">{step}</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
