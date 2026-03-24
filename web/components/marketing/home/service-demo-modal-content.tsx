"use client";

import Image from "next/image";
import clsx from "clsx";
import { AlertTriangle, Check, CheckCircle2, Sparkles, X } from "lucide-react";

export type ServiceDemoId = "benchmarking" | "salary-reviews" | "compliance-equity";

function DemoStage({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "relative min-h-[32rem] overflow-hidden rounded-bl-[2.5rem] rounded-tl-[2.5rem]",
        "bg-[radial-gradient(circle_at_26%_84%,_rgba(92,69,253,1),_rgba(92,69,253,0)_24%),linear-gradient(90deg,#a89bff_0%,#a89bff_100%)]",
        "p-6 shadow-[0_24px_64px_rgba(17,18,51,0.12)] lg:min-h-[50rem]",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0))]" />
      <div className="relative flex h-full items-center justify-center">{children}</div>
    </div>
  );
}

function CardFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "w-full rounded-[2rem] border border-white/30 bg-white/88 p-5 shadow-[-8px_16px_31px_8px_rgba(17,18,51,0.2)] backdrop-blur-[8px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "warning";
}) {
  const toneClass =
    tone === "positive" ? "text-emerald-600" : tone === "warning" ? "text-amber-600" : "text-[#111233]";

  return (
    <div className="rounded-2xl border border-[rgba(17,18,51,0.08)] bg-[#f8f8ff] p-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">{label}</div>
      <div className={clsx("mt-1 text-base font-bold", toneClass)}>{value}</div>
    </div>
  );
}

function ConfidenceBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-[rgba(92,69,253,0.12)] px-2.5 py-1 text-[11px] font-semibold text-[#5c45fd]">
      {label}
    </span>
  );
}

function BenchmarkPreview() {
  return (
    <DemoStage className="pt-10">
      <span className="absolute left-6 top-6 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#111233]">
        Board-ready output
      </span>
      <div className="absolute left-0 top-0 h-[87.5%] w-full rounded-[2rem]" />
      <Image
        src="/images/marketing/home/services-table.png"
        alt="Salary benchmarking preview"
        width={881}
        height={328}
        className="absolute left-[6.5%] top-[19.75%] z-10 h-auto w-[88%] max-w-[55.0625rem] shadow-[-8px_16px_31px_8px_rgba(17,18,51,0.3)]"
      />
      <Image
        src="/images/marketing/home/services-chart.png"
        alt="Benchmark spread output"
        width={837}
        height={238}
        className="absolute left-[25%] top-[50.5%] z-20 h-auto w-[84%] max-w-[52.3125rem] shadow-[-8px_16px_31px_8px_rgba(17,18,51,0.3)]"
      />
    </DemoStage>
  );
}

function SalaryReviewPreview({ compact = false }: { compact?: boolean }) {
  const rows = [
    { name: "Sara Ahmed", current: "AED 24,000", increase: "+8.0%", confidence: "92%" },
    { name: "Omar Khan", current: "AED 31,500", increase: "+5.5%", confidence: "84%" },
    { name: "Lina Noor", current: "AED 18,900", increase: "+6.2%", confidence: "79%" },
  ];

  return (
    <DemoStage className={compact ? "min-h-[28rem] lg:min-h-[34rem]" : "min-h-[24rem] rounded-[2rem] p-0 shadow-none lg:min-h-[30rem]"}>
      <CardFrame className={clsx(compact ? "max-w-[42rem]" : "rounded-[1.5rem] border-white/50 p-6 shadow-none")}>
        <div className="flex items-start justify-between gap-4 border-b border-[rgba(17,18,51,0.08)] pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(92,69,253,0.12)] text-[#5c45fd]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#111233]">AI Distribution Review</h3>
              <p className="text-sm text-[#5b6072]">
                Benchmark-grounded recommendations before your review cycle is approved.
              </p>
            </div>
          </div>
          <span aria-hidden="true" className="rounded-xl p-2 text-[#6b7280]">
            <X className="h-4 w-4" />
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <MiniStat label="Current payroll" value="AED 1.42m" />
          <MiniStat label="Allocated" value="AED 92k" tone="positive" />
          <MiniStat label="Remaining" value="AED 16k" tone="warning" />
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-[rgba(17,18,51,0.08)]">
          <div className="grid grid-cols-[1.3fr_0.9fr_0.8fr] bg-[#f8f8ff] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b7280]">
            <span>Employee</span>
            <span className="text-right">Current</span>
            <span className="text-right">Confidence</span>
          </div>
          <div className="divide-y divide-[rgba(17,18,51,0.08)] bg-white">
            {rows.map((row) => (
              <div key={row.name} className="grid grid-cols-[1.3fr_0.9fr_0.8fr] items-center px-4 py-3 text-sm">
                <div>
                  <div className="font-semibold text-[#111233]">{row.name}</div>
                  <div className="mt-1 text-xs text-[#5b6072]">Increase proposed {row.increase}</div>
                </div>
                <div className="text-right font-medium text-[#111233]">{row.current}</div>
                <div className="flex justify-end">
                  <ConfidenceBadge label={row.confidence} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardFrame>
    </DemoStage>
  );
}

function CompliancePreview({ compact = false }: { compact?: boolean }) {
  const jurisdictions = [
    { name: "UAE", selected: true },
    { name: "KSA", selected: true },
    { name: "Qatar", selected: false },
    { name: "Bahrain", selected: false },
  ];

  return (
    <DemoStage className={compact ? "min-h-[28rem] lg:min-h-[34rem]" : "min-h-[24rem] rounded-[2rem] p-0 shadow-none lg:min-h-[30rem]"}>
      <CardFrame className={clsx(compact ? "max-w-[34rem]" : "rounded-[1.5rem] border-white/50 p-6 shadow-none")}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#111233]">Select default jurisdictions</h3>
            <p className="text-sm text-[#5b6072]">Choose from suggestions or add a custom one.</p>
          </div>
          <span aria-hidden="true" className="rounded-full p-2 text-[#6b7280]">
            <X className="h-4 w-4" />
          </span>
        </div>

        <div className="rounded-xl border border-[rgba(17,18,51,0.08)] bg-[#f8f8ff] px-4 py-3 text-sm text-[#6b7280]">
          Search or type custom jurisdiction
        </div>

        <div className="mt-4 space-y-2">
          {jurisdictions.map((jurisdiction) => (
            <div
              key={jurisdiction.name}
              className="flex items-center justify-between rounded-lg border border-[rgba(17,18,51,0.08)] bg-white px-4 py-3 text-sm text-[#111233]"
            >
              <span>{jurisdiction.name}</span>
              {jurisdiction.selected ? <Check className="h-4 w-4 text-[#5c45fd]" /> : null}
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <span
            aria-hidden="true"
            className="rounded-full border border-[rgba(17,18,51,0.12)] bg-white px-4 py-2 text-sm font-semibold text-[#111233]"
          >
            Done
          </span>
        </div>
      </CardFrame>
    </DemoStage>
  );
}

function BenchmarkModalDemo() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
      <BenchmarkPreview />
      <div className="rounded-[1.5rem] border border-[rgba(17,18,51,0.08)] bg-[rgba(92,69,253,0.04)] p-5">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5c45fd]">Board-ready output</div>
        <div className="mt-4 grid gap-3">
          <MiniStat label="Benchmark source" value="Live UAE market" />
          <MiniStat label="Median anchor" value="P50 current" />
          <MiniStat label="Confidence" value="High signal" tone="positive" />
        </div>
        <div className="mt-5 space-y-3">
          {["Compare P40, P50, and P60 ranges", "Review spread quality before sharing", "Export a clean market-backed summary"].map(
            (item) => (
              <div key={item} className="flex items-start gap-3 rounded-[1rem] bg-white px-4 py-3 shadow-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5c45fd]" />
                <p className="text-sm leading-[1.5] text-[#111233]">{item}</p>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function SalaryReviewModalDemo() {
  return (
    <div className="rounded-[2rem] border border-[rgba(17,18,51,0.08)] bg-white p-6 shadow-[0_20px_50px_rgba(17,18,51,0.08)]">
      <div className="flex items-start justify-between gap-4 border-b border-[rgba(17,18,51,0.08)] pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(92,69,253,0.12)] text-[#5c45fd]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#111233]">AI Distribution Review</h3>
            <p className="mt-1 text-sm text-[#5b6072]">
              Benchmark-grounded recommendations. Use this draft as a starting point, then continue in the review flow.
            </p>
          </div>
        </div>
        <span aria-hidden="true" className="rounded-xl p-2 text-[#6b7280]">
          <X className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Current payroll" value="AED 1.42m" />
        <MiniStat label="Proposed payroll" value="AED 1.51m" />
        <MiniStat label="Allocated" value="AED 92k (85%)" tone="positive" />
        <MiniStat label="Remaining" value="AED 16k" tone="warning" />
      </div>

      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <div className="text-sm font-semibold text-amber-700">AI warnings</div>
            <div className="mt-1 text-sm text-amber-700">
              Some recommendations sit near the upper edge of the selected budget policy.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-[rgba(17,18,51,0.08)]">
        <div className="grid grid-cols-[1.25fr_0.9fr_0.8fr_0.8fr] bg-[#f8f8ff] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b7280]">
          <span>Employee</span>
          <span className="text-right">Current</span>
          <span className="text-right">Increase</span>
          <span className="text-right">Confidence</span>
        </div>
        <div className="divide-y divide-[rgba(17,18,51,0.08)] bg-white">
          {[
            ["Sara Ahmed", "AED 24,000", "+AED 1,920", "92%"],
            ["Omar Khan", "AED 31,500", "+AED 1,732", "84%"],
            ["Lina Noor", "AED 18,900", "+AED 1,172", "79%"],
          ].map(([name, current, increase, confidence]) => (
            <div key={name} className="grid grid-cols-[1.25fr_0.9fr_0.8fr_0.8fr] items-center px-4 py-3 text-sm">
              <div>
                <div className="font-semibold text-[#111233]">{name}</div>
                <div className="mt-1 text-xs text-[#5b6072]">Why AI suggested this</div>
              </div>
              <div className="text-right text-[#111233]">{current}</div>
              <div className="text-right font-semibold text-emerald-600">{increase}</div>
              <div className="flex justify-end">
                <ConfidenceBadge label={confidence} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComplianceModalDemo() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <CompliancePreview />
      <div className="rounded-[1.5rem] border border-[rgba(17,18,51,0.08)] bg-white p-5 shadow-[0_18px_40px_rgba(17,18,51,0.08)]">
        <div className="flex items-start justify-between gap-3 border-b border-[rgba(17,18,51,0.08)] pb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5c45fd]">Compliance drawer</div>
            <div className="mt-1 text-lg font-semibold text-[#111233]">Policy Completion Card</div>
          </div>
          <ConfidenceBadge label="89% signed" />
        </div>
        <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#ecebff]">
          <div className="h-full w-[89%] rounded-full bg-[#5c45fd]" />
        </div>
        <div className="mt-5 space-y-3">
          {[
            "Selected jurisdictions currently scope regulatory updates.",
            "Low completion directly increases policy risk and can block audits.",
            "Use the drawer context to follow up on outstanding signatories.",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-[1rem] bg-[#f8f8ff] px-4 py-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5c45fd]" />
              <p className="text-sm leading-[1.5] text-[#111233]">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ServiceDemoPreview({ serviceId }: { serviceId: ServiceDemoId }) {
  if (serviceId === "benchmarking") {
    return <BenchmarkPreview />;
  }

  if (serviceId === "salary-reviews") {
    return <SalaryReviewPreview compact />;
  }

  return <CompliancePreview compact />;
}

export function ServiceDemoModalContent({ serviceId }: { serviceId: ServiceDemoId }) {
  if (serviceId === "benchmarking") {
    return <BenchmarkModalDemo />;
  }

  if (serviceId === "salary-reviews") {
    return <SalaryReviewModalDemo />;
  }

  return <ComplianceModalDemo />;
}
