import type { Report } from "./types";

export type ReportTypeId = Report["type_id"];

export type ReportType = {
  id: ReportTypeId;
  label: string;
  description: string;
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
