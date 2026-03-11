import type { ExecutiveInsightsResponse } from "@/lib/admin/executive-insights";

export type ExecutiveCardTone = "neutral" | "warning" | "positive" | "market";

export type ExecutiveHeadlineCard = {
  label: string;
  value: string;
  description: string;
  tone: ExecutiveCardTone;
};

export function buildExecutiveHeadlineCards(
  insights: ExecutiveInsightsResponse,
): ExecutiveHeadlineCard[] {
  return [
    {
      label: "Market Rows",
      value: `${insights.market.summary.benchmarkCount}`,
      description: "pooled benchmark rows in the platform market",
      tone: "market",
    },
    {
      label: "Roles Covered",
      value: `${insights.market.summary.uniqueRoles}`,
      description: "unique roles across the pooled market",
      tone: "market",
    },
    {
      label: "Active Workspaces",
      value: `${insights.tenantHealth.activeWorkspaceCount}`,
      description: "tenants with employee, upload, or benchmark activity",
      tone: insights.tenantHealth.activeWorkspaceCount > 0 ? "positive" : "warning",
    },
    {
      label: "Employees Tracked",
      value: `${insights.tenantHealth.employeeCount}`,
      description: "employees contributing to tenant health telemetry",
      tone: "neutral",
    },
    {
      label: "Enabled Sources",
      value: `${insights.ops.sources.enabled}`,
      description: "ingestion sources currently enabled",
      tone: insights.ops.sources.enabled > 0 ? "positive" : "warning",
    },
    {
      label: "Integrity Flags",
      value: `${insights.integrityFlags.length}`,
      description: "platform conditions requiring operator attention",
      tone: insights.integrityFlags.length > 0 ? "warning" : "positive",
    },
  ];
}

export function getExecutiveCardToneClasses(tone: ExecutiveCardTone): string {
  switch (tone) {
    case "market":
      return "border-brand-200 bg-brand-50 text-brand-900";
    case "positive":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-900";
    default:
      return "border-border bg-surface-1 text-text-primary";
  }
}

export function getIntegrityFlagTone(
  severity: ExecutiveInsightsResponse["integrityFlags"][number]["severity"],
): string {
  if (severity === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  return "border-blue-200 bg-blue-50 text-blue-900";
}
