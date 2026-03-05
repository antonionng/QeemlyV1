/* ── Compliance fixture data & types ── */

export type RiskItem = {
  id: string;
  area: string;
  level: number;
  status: "Critical" | "High" | "Moderate" | "Low";
  description: string;
};

export type EquityLevel = {
  level: string;
  gap: string;
  barPercent: number;
  direction: "up" | "down" | "neutral";
};

export type PolicyItem = {
  id: string;
  name: string;
  rate: number;
  status: "Success" | "Pending" | "Critical";
};

export type RegulatoryUpdate = {
  id: string;
  title: string;
  description: string;
  date: string;
  status: "Active" | "Pending" | "Review";
  impact: "High" | "Medium" | "Low";
  jurisdiction: string;
};

export type DeadlineItem = {
  id: string;
  date: string;
  title: string;
  type: "Urgent" | "Regular" | "Mandatory";
};

export type VisaStat = {
  label: string;
  value: string;
  color: "brand" | "amber" | "red" | "emerald";
};

export type VisaTimelineItem = {
  id: string;
  title: string;
  description: string;
  type: "Critical" | "Success" | "Update";
};

export type DocumentItem = {
  id: string;
  name: string;
  docType: string;
  expiry: string;
  status: "Active" | "Review" | "Expiring";
  size: string;
};

export type AuditLogItem = {
  id: string;
  action: string;
  target: string;
  user: string;
  time: string;
  iconType: "document" | "policy" | "risk" | "user";
};

export type DrawerContent =
  | { type: "risk"; item: RiskItem }
  | { type: "policy"; item: PolicyItem }
  | { type: "update"; item: RegulatoryUpdate }
  | { type: "deadline"; item: DeadlineItem }
  | { type: "visa"; item: VisaTimelineItem }
  | { type: "document"; item: DocumentItem }
  | { type: "audit"; item: AuditLogItem }
  | { type: "deadlines-all" }
  | { type: "visa-all" }
  | { type: "documents-all" }
  | { type: "audit-all" }
  | null;

/* ── Fixture arrays ── */

export const RISK_ITEMS: RiskItem[] = [];

export const PAY_EQUITY_KPIS = [
  { id: "pek1", label: "Gender Pay Gap", value: "N/A", subtitle: "No data", delta: "0", deltaDirection: "down" as const },
  { id: "pek2", label: "Equity Score", value: "N/A", subtitle: "No data" },
  { id: "pek3", label: "Audited Roles", value: "0", subtitle: "No data" },
];

export const EQUITY_LEVELS: EquityLevel[] = [];

export const POLICY_ITEMS: PolicyItem[] = [];

export const REGULATORY_UPDATES: RegulatoryUpdate[] = [];

export const DEADLINE_ITEMS: DeadlineItem[] = [];

export const VISA_STATS: VisaStat[] = [];

export const VISA_TIMELINE: VisaTimelineItem[] = [];

export const DOCUMENT_ITEMS: DocumentItem[] = [];

export const AUDIT_LOG_ITEMS: AuditLogItem[] = [];
