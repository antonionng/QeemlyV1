"use client";

import type { ReactNode } from "react";
import { ArrowRight, FileDown, Upload, Users } from "lucide-react";
import Link from "next/link";

type ReviewActionCardsProps = {
  selectedEmployees: number;
  coveredEmployees: number;
  totalEmployees: number;
  proposedEmployees: number;
};

export function ReviewActionCards({
  selectedEmployees,
  coveredEmployees,
  totalEmployees,
  proposedEmployees,
}: ReviewActionCardsProps) {
  const needsCoverageHelp = coveredEmployees < totalEmployees;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ActionCard
        title="Open Benchmarking"
        body={
          needsCoverageHelp
            ? "Review thin or missing matches before final approval so market positioning stays defensible."
            : "Jump into deeper cohort analysis when you need to validate a recommendation before approving it."
        }
        href="/dashboard/benchmarks"
        cta="Open Benchmarking"
      />
      <ActionCard
        title="Review People Data"
        body={
          selectedEmployees === 0
            ? "Select the employee population you want to review, then come back here to build a proposal."
            : `${selectedEmployees} employees are currently selected. Use People to fix role, level, or location gaps.`
        }
        href="/dashboard/people"
        cta="Open People"
        icon={<Users className="h-4 w-4" />}
      />
      <ActionCard
        title={proposedEmployees > 0 ? "Export Current Selection" : "Strengthen Coverage"}
        body={
          proposedEmployees > 0
            ? "Jump to the export controls and download the selected review set for offline discussion."
            : "Upload compensation or benchmark data to improve coverage before you generate a proposal."
        }
        href={proposedEmployees > 0 ? "#review-controls" : "/dashboard/upload"}
        cta={proposedEmployees > 0 ? "Open Export Controls" : "Upload Data"}
        icon={proposedEmployees > 0 ? <FileDown className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
      />
    </div>
  );
}

function ActionCard({
  title,
  body,
  href,
  cta,
  icon,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-accent-100 bg-accent-50/40 p-4">
      <h4 className="text-sm font-semibold text-accent-950">{title}</h4>
      <p className="mt-2 text-sm text-accent-600">{body}</p>
      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
      >
        {icon}
        {cta}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
