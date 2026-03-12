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
    "Normalization review",
    "Data quality and freshness governance",
    "Benchmark publishing",
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
    benchmarkCoverageLabel: `${input.totalBenchmarks} shared market rows ready for review`,
    publishStatusLabel: `Publish status ${input.freshnessScore}`,
  };
}

export const WORKBENCH_STAGES = [
  {
    id: "intake",
    label: "Inbox",
    description: "Collect manual CSV and PDF research inputs before they affect the market dataset.",
    href: "/admin/inbox",
  },
  {
    id: "snapshot",
    label: "Snapshots",
    description: "Inspect raw source payloads and staging records before normalization.",
    href: "/admin/snapshots",
  },
  {
    id: "review",
    label: "Review & Normalize",
    description: "Map roles, levels, locations, provenance, and confidence.",
    href: "/admin/review",
  },
  {
    id: "quality",
    label: "Freshness & Quality",
    description: "Monitor staleness, density, and confidence before publishing.",
    href: "/admin/freshness",
  },
  {
    id: "publish",
    label: "Publish",
    description: "Promote reviewed evidence into the live Qeemly market benchmark layer.",
    href: "/admin/publish",
  },
] as const;
