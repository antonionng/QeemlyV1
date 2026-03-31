export const ADMIN_DATA_OWNERSHIP = {
  tenantDashboard: [
    "Employee roster uploads",
    "Compensation updates",
    "Company pay band uploads",
    "Tenant reports and salary review actions",
  ],
  superAdminWorkbench: [
    "Shared market source ingestion",
    "Manual CSV and PDF research intake",
    "Live market freshness and quality monitoring",
    "Published benchmark coverage review",
    "Advanced market refresh diagnostics",
  ],
} as const;

export type ResearchAssetKind = "csv" | "pdf" | "other";

export function classifyResearchAsset(fileName: string): {
  kind: ResearchAssetKind;
  queue: "Structured import" | "Document review" | "Needs triage";
} {
  const normalized = fileName.trim().toLowerCase();
  if (normalized.endsWith(".csv") || normalized.endsWith(".xlsx") || normalized.endsWith(".xls")) {
    return { kind: "csv", queue: "Structured import" };
  }
  if (normalized.endsWith(".pdf")) {
    return { kind: "pdf", queue: "Document review" };
  }
  return { kind: "other", queue: "Needs triage" };
}

export function getWorkbenchCoverageSummary(input: {
  totalSources: number;
  enabledSources: number;
  totalBenchmarks: number;
  freshnessScore: string;
}) {
  return {
    sourceCoverageLabel: `${input.enabledSources} of ${input.totalSources} sources enabled`,
    benchmarkCoverageLabel: `${input.totalBenchmarks} shared market rows live`,
    publishStatusLabel: `Freshness status ${input.freshnessScore}`,
  };
}

export const WORKBENCH_STAGES = [
  {
    id: "intake",
    label: "Data Intake",
    description: "Manage manual uploads, automated sources, and recent ingestion activity in one operator workflow.",
    href: "/admin/intake",
  },
  {
    id: "market",
    label: "Market Overview",
    description: "See what is live now, monitor freshness, browse benchmarks, and open advanced diagnostics when needed.",
    href: "/admin/market",
  },
] as const;
