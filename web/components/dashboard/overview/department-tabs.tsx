"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { SalaryViewMode } from "@/components/ui/salary-view-toggle";
import Link from "next/link";
import clsx from "clsx";
import { 
  type Department, 
  formatAEDCompact,
} from "@/lib/employees";
import type { OverviewDepartmentSummary } from "@/lib/dashboard/company-overview";
import { useSalaryView, applyViewMode } from "@/lib/salary-view-store";

interface DepartmentTabsProps {
  summaries: OverviewDepartmentSummary[];
}

export function DepartmentTabs({ summaries }: DepartmentTabsProps) {
  const { salaryView } = useSalaryView();
  const [selectedDept, setSelectedDept] = useState<Department | null>(summaries[0]?.department ?? null);
  const selectedSummary = selectedDept ? summaries.find(s => s.department === selectedDept) : null;

  if (!selectedSummary) {
    return (
      <Card className="rounded-[16px] border-[#EEF1F6] bg-white p-5 shadow-[0px_2px_8px_rgba(16,24,40,0.04)] sm:p-7">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-[#111233]">Department Breakdown</h3>
          <p className="text-[13px] leading-5 text-[#969799]">
            Department insights will appear once employee benchmarks are available.
          </p>
        </div>
      </Card>
    );
  }

  const payrollValue = formatPayrollValue(selectedSummary.totalPayroll, salaryView);
  const metricDeltaTone = selectedSummary.avgVsMarket > 0 ? "text-[#FE9A00]" : "text-[#FF2056]";
  const summaryCards = [
    {
      label: "In Band",
      count: selectedSummary.inBandCount,
      pct: selectedSummary.inBandPct,
      bgColor: "rgba(0,188,125,0.1)",
      borderColor: "rgba(0,188,125,0.2)",
      textColor: "#00BC7D",
    },
    {
      label: "Above Band",
      count: selectedSummary.aboveBandCount,
      pct: selectedSummary.aboveBandPct,
      bgColor: "rgba(254,154,0,0.1)",
      borderColor: "rgba(254,154,0,0.2)",
      textColor: "#FE9A00",
    },
    {
      label: "Below Band",
      count: selectedSummary.belowBandCount,
      pct: selectedSummary.belowBandPct,
      bgColor: "rgba(255,32,86,0.1)",
      borderColor: "rgba(255,32,86,0.2)",
      textColor: "#FF2056",
    },
  ];

  return (
    <Card className="rounded-[16px] border-[#EEF1F6] bg-white p-5 shadow-[0px_2px_8px_rgba(16,24,40,0.04)] sm:p-7">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-[#111233]">Department Breakdown</h3>
        <p className="text-[13px] leading-5 text-[#969799]">
          Click a department for detail
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {summaries.map((summary) => (
          <button
            key={summary.department}
            type="button"
            onClick={() => setSelectedDept(summary.department)}
            className={clsx(
              "rounded-full border px-[14px] py-1.5 text-[13px] font-medium leading-5 transition-colors",
              selectedDept === summary.department
                ? "border-[#5C45FD] bg-[rgba(92,69,253,0.8)] text-white"
                : "border-[rgba(92,69,253,0.2)] bg-white text-[#111233]",
            )}
          >
            {summary.department}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-[13px] font-medium leading-5 text-[#111233]">
            {selectedSummary.department} Payroll
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <p className="break-words text-[clamp(2rem,7vw,2.5rem)] font-bold leading-none text-[#111233]">
              {payrollValue}
            </p>
            <p className={`pb-1 text-sm font-medium ${metricDeltaTone}`}>
              {selectedSummary.avgVsMarket >= 0 ? "+" : ""}
              {selectedSummary.avgVsMarket}%<span className="ml-1 text-[#969799]">vs market</span>
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[13px] font-medium leading-5 text-[#111233]">Headcount</p>
          <p className="break-words text-[clamp(2rem,7vw,2.5rem)] font-bold leading-none text-[#111233]">
            {selectedSummary.activeCount}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[12px] border p-4"
            style={{ backgroundColor: card.bgColor, borderColor: card.borderColor }}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="break-words text-[13px] font-semibold leading-5" style={{ color: card.textColor }}>
                {card.label}
              </p>
              <p className="text-[13px] font-medium leading-5 text-[#969799]">{card.pct}%</p>
            </div>
            <p className="mt-2 text-[30px] font-bold leading-none text-[#111233]">{card.count}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Link
          href={`/dashboard/salary-review?department=${selectedSummary.department}`}
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[linear-gradient(90deg,#5C45FD,#5C45FD)] px-4 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          <span className="text-center">View {selectedSummary.department} employees</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={1.7} />
        </Link>
      </div>
    </Card>
  );
}

function formatPayrollValue(totalPayroll: number, salaryView: SalaryViewMode) {
  return formatAEDCompact(applyViewMode(totalPayroll, salaryView)).replace(/^AED\s*/, "");
}
