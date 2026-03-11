export type OverviewShortcutIcon = "play" | "users" | "download" | "chart" | "upload";

export type OverviewShortcut = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: OverviewShortcutIcon;
};

export const OVERVIEW_SHORTCUTS: OverviewShortcut[] = [
  {
    id: "run-salary-review",
    title: "Run Salary Review",
    description: "Start new compensation review cycle",
    href: "/dashboard/salary-review",
    icon: "play",
  },
  {
    id: "view-outside-band",
    title: "View Outside Band",
    description: "Employees requiring attention",
    href: "/dashboard/salary-review?filter=outside-band",
    icon: "users",
  },
  {
    id: "export-report",
    title: "Export Report",
    description: "Download compensation summary",
    href: "/dashboard/reports",
    icon: "download",
  },
  {
    id: "explore-benchmarks",
    title: "Explore Benchmarks",
    description: "Qeemly market comparison data",
    href: "/dashboard/benchmarks",
    icon: "chart",
  },
  {
    id: "import-company-data",
    title: "Import Company Data",
    description: "Add incremental updates or replace your roster",
    href: "/dashboard/upload",
    icon: "upload",
  },
];

export function getOverviewShortcutGuidance(): string {
  return "Use Import Company Data for incremental updates, or replace your current roster with a fresh file when you need a clean reset.";
}
