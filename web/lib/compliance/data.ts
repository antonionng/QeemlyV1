/* Compliance shared types */

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
