export const SOURCE_VALUES = ["integration", "import", "manual", "seed"] as const;
export type SourceValue = (typeof SOURCE_VALUES)[number];

export const RISK_WEIGHT_KEYS = [
  "benchmarkCoverage",
  "outOfBand",
  "policyCompletion",
  "documents",
  "visa",
  "deadlines",
] as const;

export type RiskWeightKey = (typeof RISK_WEIGHT_KEYS)[number];
export type RiskWeights = Record<RiskWeightKey, number>;

export const DEFAULT_RISK_WEIGHTS: RiskWeights = {
  benchmarkCoverage: 0.2,
  outOfBand: 0.25,
  policyCompletion: 0.2,
  documents: 0.1,
  visa: 0.15,
  deadlines: 0.1,
};

export type ComplianceSettingsPayload = {
  prefer_integration_data: boolean;
  prefer_import_data: boolean;
  allow_manual_overrides: boolean;
  default_jurisdictions: string[];
  visa_lead_time_days: number;
  deadline_sla_days: number;
  document_renewal_threshold_days: number;
  risk_weights: RiskWeights;
  is_compliance_configured: boolean;
};

export const DEFAULT_COMPLIANCE_SETTINGS: ComplianceSettingsPayload = {
  prefer_integration_data: true,
  prefer_import_data: true,
  allow_manual_overrides: true,
  default_jurisdictions: ["UAE"],
  visa_lead_time_days: 30,
  deadline_sla_days: 14,
  document_renewal_threshold_days: 45,
  risk_weights: DEFAULT_RISK_WEIGHTS,
  is_compliance_configured: false,
};

export const SETTINGS_FIELDS = [
  "prefer_integration_data",
  "prefer_import_data",
  "allow_manual_overrides",
  "default_jurisdictions",
  "visa_lead_time_days",
  "deadline_sla_days",
  "document_renewal_threshold_days",
  "risk_weights",
  "is_compliance_configured",
] as const;

export type SettingsField = (typeof SETTINGS_FIELDS)[number];

export type FieldType = "text" | "number" | "date" | "datetime" | "textarea" | "select";
export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  options?: readonly string[];
};

export type ComplianceDomain =
  | "policies"
  | "regulatory-updates"
  | "deadlines"
  | "visa-cases"
  | "documents"
  | "audit-events";

export type DomainConfig = {
  key: ComplianceDomain;
  label: string;
  singularLabel: string;
  table: string;
  select: string;
  orderBy: string;
  createRequired: readonly string[];
  allowedFields: readonly string[];
  defaults: Record<string, unknown>;
  fields: readonly FieldDef[];
};

export const DOMAIN_CONFIG: Record<ComplianceDomain, DomainConfig> = {
  policies: {
    key: "policies",
    label: "Policies",
    singularLabel: "Policy",
    table: "compliance_policies",
    select: "id,name,completion_rate,status,due_date,data_source,source_updated_at,created_at,updated_at",
    orderBy: "updated_at",
    createRequired: ["name"],
    allowedFields: ["name", "completion_rate", "status", "due_date", "data_source", "source_updated_at"],
    defaults: {
      name: "",
      completion_rate: 90,
      status: "Pending",
      due_date: new Date().toISOString().slice(0, 10),
      data_source: "manual",
    },
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "completion_rate", label: "Completion %", type: "number" },
      { key: "status", label: "Status", type: "select", options: ["Success", "Pending", "Critical"] },
      { key: "due_date", label: "Due Date", type: "date" },
      { key: "data_source", label: "Source", type: "select", options: SOURCE_VALUES },
    ],
  },
  "regulatory-updates": {
    key: "regulatory-updates",
    label: "Regulatory Updates",
    singularLabel: "Regulatory Update",
    table: "compliance_regulatory_updates",
    select: "id,title,description,published_date,status,impact,jurisdiction,data_source,source_updated_at,created_at,updated_at",
    orderBy: "published_date",
    createRequired: ["title"],
    allowedFields: [
      "title",
      "description",
      "published_date",
      "status",
      "impact",
      "jurisdiction",
      "data_source",
      "source_updated_at",
    ],
    defaults: {
      title: "",
      description: "",
      published_date: new Date().toISOString().slice(0, 10),
      status: "Active",
      impact: "Medium",
      jurisdiction: "UAE",
      data_source: "manual",
    },
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "published_date", label: "Published Date", type: "date" },
      { key: "status", label: "Status", type: "select", options: ["Active", "Pending", "Review"] },
      { key: "impact", label: "Impact", type: "select", options: ["High", "Medium", "Low"] },
      { key: "jurisdiction", label: "Jurisdiction", type: "text" },
      { key: "data_source", label: "Source", type: "select", options: SOURCE_VALUES },
    ],
  },
  deadlines: {
    key: "deadlines",
    label: "Deadlines",
    singularLabel: "Deadline",
    table: "compliance_deadlines",
    select: "id,due_at,title,type,status,data_source,source_updated_at,created_at,updated_at",
    orderBy: "due_at",
    createRequired: ["due_at", "title"],
    allowedFields: ["due_at", "title", "type", "status", "data_source", "source_updated_at"],
    defaults: {
      title: "",
      due_at: new Date().toISOString().slice(0, 10),
      type: "Regular",
      status: "open",
      data_source: "manual",
    },
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "due_at", label: "Due Date", type: "date" },
      { key: "type", label: "Type", type: "select", options: ["Urgent", "Regular", "Mandatory"] },
      { key: "status", label: "Status", type: "select", options: ["open", "done", "overdue"] },
      { key: "data_source", label: "Source", type: "select", options: SOURCE_VALUES },
    ],
  },
  "visa-cases": {
    key: "visa-cases",
    label: "Visa Cases",
    singularLabel: "Visa Case",
    table: "compliance_visa_cases",
    select: "id,employee_id,title,description,status,expires_on,data_source,source_updated_at,created_at,updated_at",
    orderBy: "updated_at",
    createRequired: ["title"],
    allowedFields: ["employee_id", "title", "description", "status", "expires_on", "data_source", "source_updated_at"],
    defaults: {
      title: "",
      description: "",
      status: "active",
      expires_on: new Date().toISOString().slice(0, 10),
      data_source: "manual",
    },
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: ["active", "expiring", "overdue", "open_case"] },
      { key: "expires_on", label: "Expires On", type: "date" },
      { key: "data_source", label: "Source", type: "select", options: SOURCE_VALUES },
    ],
  },
  documents: {
    key: "documents",
    label: "Documents",
    singularLabel: "Document",
    table: "compliance_documents",
    select: "id,name,doc_type,expiry_date,status,size_bytes,data_source,source_updated_at,created_at,updated_at",
    orderBy: "expiry_date",
    createRequired: ["name", "doc_type"],
    allowedFields: ["name", "doc_type", "expiry_date", "status", "size_bytes", "data_source", "source_updated_at"],
    defaults: {
      name: "",
      doc_type: "Permit",
      expiry_date: new Date().toISOString().slice(0, 10),
      status: "Review",
      size_bytes: 1000000,
      data_source: "manual",
    },
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "doc_type", label: "Document Type", type: "text" },
      { key: "expiry_date", label: "Expiry Date", type: "date" },
      { key: "status", label: "Status", type: "select", options: ["Active", "Review", "Expiring"] },
      { key: "size_bytes", label: "Size (bytes)", type: "number" },
      { key: "data_source", label: "Source", type: "select", options: SOURCE_VALUES },
    ],
  },
  "audit-events": {
    key: "audit-events",
    label: "Audit Events",
    singularLabel: "Audit Event",
    table: "compliance_audit_events",
    select: "id,action,target,actor,icon_type,metadata,event_time,data_source,source_updated_at,created_at",
    orderBy: "event_time",
    createRequired: ["action", "target", "actor"],
    allowedFields: [
      "action",
      "target",
      "actor",
      "icon_type",
      "metadata",
      "event_time",
      "data_source",
      "source_updated_at",
    ],
    defaults: {
      action: "Updated",
      target: "",
      actor: "",
      icon_type: "policy",
      event_time: new Date().toISOString(),
      data_source: "manual",
    },
    fields: [
      { key: "action", label: "Action", type: "text" },
      { key: "target", label: "Target", type: "text" },
      { key: "actor", label: "Actor", type: "text" },
      { key: "icon_type", label: "Icon Type", type: "select", options: ["document", "policy", "risk", "user"] },
      { key: "event_time", label: "Event Time", type: "datetime" },
      { key: "data_source", label: "Source", type: "select", options: SOURCE_VALUES },
    ],
  },
};

export function isComplianceDomain(value: string): value is ComplianceDomain {
  return value in DOMAIN_CONFIG;
}
