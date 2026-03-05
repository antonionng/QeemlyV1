export type ReportTypeId = "overview" | "benchmark" | "compliance" | "custom";

export type ReportType = {
  id: ReportTypeId;
  label: string;
  description: string;
};

export type ReportTemplate = {
  id: string;
  typeId: ReportTypeId;
  title: string;
  description: string;
  cadence: string;
  coverage: string;
  confidence: "High" | "Medium" | "Low";
  lastUpdated: string;
  owner: string;
  tags: string[];
};

export type ReportKpi = {
  id: string;
  label: string;
  value: string;
  delta: string;
  deltaLabel: string;
  trend: "up" | "down" | "stable";
  valueColor?: string;
};

export type ReportStatus = "Scheduled" | "Ready" | "In Review" | "Building";

export type ReportGridItem = {
  id: string;
  title: string;
  owner: string;
  date: string;
  status: ReportStatus;
  typeId: ReportTypeId;
  tags: string[];
};

export type RecentReport = {
  id: string;
  title: string;
  typeId: ReportTypeId;
  owner: string;
  lastRun: string;
  status: "Ready" | "Building" | "Scheduled";
  format: "PDF" | "XLSX" | "Slides";
  recipients: number;
};

export const REPORT_TYPES: ReportType[] = [
  {
    id: "overview",
    label: "Summary",
    description: "Board-ready rollups of comp health, budget, and trends.",
  },
  {
    id: "benchmark",
    label: "Benchmark",
    description: "Role, location, and level comparisons with percentiles.",
  },
  {
    id: "compliance",
    label: "Compliance",
    description: "Policy adherence, pay equity, and audit notes.",
  },
  {
    id: "custom",
    label: "Custom",
    description: "Build a bespoke report using drag-and-drop blocks.",
  },
];

export const REPORT_KPIS: ReportKpi[] = [
  {
    id: "generated",
    label: "Reports Generated",
    value: "0",
    delta: "0",
    deltaLabel: "until reports are created",
    trend: "stable",
  },
  {
    id: "ready",
    label: "Ready to Share",
    value: "0",
    delta: "0",
    deltaLabel: "until reports are created",
    trend: "stable",
  },
  {
    id: "coverage",
    label: "Coverage",
    value: "0%",
    delta: "0",
    deltaLabel: "until reports are created",
    trend: "stable",
  },
  {
    id: "confidence",
    label: "Average Confidence",
    value: "N/A",
    delta: "Stable",
    deltaLabel: "until reports are created",
    trend: "stable",
  },
];

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "temp-overview-board",
    typeId: "overview",
    title: "Executive Summary",
    description: "Top-line comp health, market movement, and budget signals.",
    cadence: "Monthly",
    coverage: "All roles · GCC",
    confidence: "High",
    lastUpdated: "2026-01-12T10:00:00Z",
    owner: "People Analytics",
    tags: ["Board Check", "Trends", "Budget"],
  },
  {
    id: "temp-overview-ops",
    typeId: "overview",
    title: "Ops Scoreboard",
    description: "Operational KPIs for compensation cycles and approvals.",
    cadence: "Weekly",
    coverage: "All regions · 18 markets",
    confidence: "High",
    lastUpdated: "2026-01-10T08:30:00Z",
    owner: "Comp Ops",
    tags: ["Board Check", "Trends", "Budget"],
  },
  {
    id: "temp-benchmark-role",
    typeId: "benchmark",
    title: "Role Benchmark Pack",
    description: "Role family benchmarks with percentile movement.",
    cadence: "On Demand",
    coverage: "Engineering · GCC",
    confidence: "High",
    lastUpdated: "2026-01-11T14:15:00Z",
    owner: "Total Rewards",
    tags: ["Board Check", "Trends", "Budget"],
  },
  {
    id: "temp-benchmark-geo",
    typeId: "benchmark",
    title: "Geo Compensation",
    description: "Location-based benchmarking for hiring hubs.",
    cadence: "Quarterly",
    coverage: "UAE · KSA · Qatar",
    confidence: "Medium",
    lastUpdated: "2026-01-05T09:00:00Z",
    owner: "Talent Partners",
    tags: ["Location", "Hot markets"],
  },
  {
    id: "temp-compliance-equity",
    typeId: "compliance",
    title: "Pay Equity Review",
    description: "Identify pay equity gaps and remediation actions.",
    cadence: "Monthly",
    coverage: "All business units",
    confidence: "High",
    lastUpdated: "2026-01-09T12:45:00Z",
    owner: "Compliance",
    tags: ["Equity", "Audit"],
  },
  {
    id: "temp-compliance-policy",
    typeId: "compliance",
    title: "Policy Adherence",
    description: "Tracks out-of-band offers and approval exceptions.",
    cadence: "On demand",
    coverage: "All offers",
    confidence: "Medium",
    lastUpdated: "2026-01-08T15:20:00Z",
    owner: "People Ops",
    tags: ["Exceptions", "Approvals"],
  },
  {
    id: "temp-custom-workforce",
    typeId: "custom",
    title: "Workforce Plan Builder",
    description: "Tailor scenarios for headcount, comp, and budget.",
    cadence: "On demand",
    coverage: "Custom selection",
    confidence: "Medium",
    lastUpdated: "2026-01-07T11:10:00Z",
    owner: "Strategic HR",
    tags: ["Scenario", "Headcount"],
  },
  {
    id: "temp-custom-offer",
    typeId: "custom",
    title: "Offer Audit Pack",
    description: "Build a pack for leadership sign-off on offers.",
    cadence: "On demand",
    coverage: "Selected roles",
    confidence: "High",
    lastUpdated: "2026-01-06T16:05:00Z",
    owner: "Recruiting Ops",
    tags: ["Approvals", "Offer notes"],
  },
];

export const REPORT_GRID_ITEMS: ReportGridItem[] = [];

export const RECENT_REPORTS: RecentReport[] = [];

export function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
