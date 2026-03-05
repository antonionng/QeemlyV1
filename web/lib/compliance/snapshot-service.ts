import { createServiceClient } from "@/lib/supabase/service";
import { createClient as createUserClient } from "@/lib/supabase/server";
import { runComplianceAiScoring } from "@/lib/compliance/ai-scoring";
import {
  DEFAULT_COMPLIANCE_SETTINGS,
  DEFAULT_RISK_WEIGHTS,
  RISK_WEIGHT_KEYS,
  type ComplianceSettingsPayload,
  type RiskWeightKey,
} from "@/lib/compliance/settings-schema";

type EmployeeRow = {
  id: string;
  level_id: string;
  role_id: string;
  location_id: string;
  base_salary: number | null;
  bonus: number | null;
  equity: number | null;
  status: "active" | "inactive";
  employment_type: "national" | "expat";
};

type BenchmarkRow = {
  role_id: string;
  level_id: string;
  location_id: string;
  p25: number;
  p50: number;
  p75: number;
};

type PolicyRow = {
  id: string;
  name: string;
  completion_rate: number | null;
  status: "Success" | "Pending" | "Critical" | null;
  data_source: "integration" | "import" | "manual" | "seed" | null;
};

type RegulatoryRow = {
  id: string;
  title: string;
  description: string | null;
  published_date: string | null;
  status: "Active" | "Pending" | "Review" | null;
  impact: "High" | "Medium" | "Low" | null;
  jurisdiction: string | null;
  data_source: "integration" | "import" | "manual" | "seed" | null;
};

type DeadlineRow = {
  id: string;
  due_at: string | null;
  title: string;
  type: "Urgent" | "Regular" | "Mandatory" | null;
  status: "open" | "done" | "overdue" | null;
  data_source: "integration" | "import" | "manual" | "seed" | null;
};

type VisaCaseRow = {
  id: string;
  title: string;
  description: string | null;
  status: "active" | "expiring" | "overdue" | "open_case" | null;
  expires_on: string | null;
  data_source: "integration" | "import" | "manual" | "seed" | null;
};

type DocumentRow = {
  id: string;
  name: string;
  doc_type: string;
  expiry_date: string | null;
  status: "Active" | "Review" | "Expiring" | null;
  size_bytes: number | null;
  data_source: "integration" | "import" | "manual" | "seed" | null;
};

type AuditEventRow = {
  id: string;
  action: string;
  target: string;
  actor: string;
  event_time: string | null;
  icon_type: "document" | "policy" | "risk" | "user" | null;
  data_source: "integration" | "import" | "manual" | "seed" | null;
};

type ComplianceSourceSettings = {
  prefer_integration_data: boolean;
  prefer_import_data: boolean;
  allow_manual_overrides: boolean;
};

type SnapshotComplianceSettings = ComplianceSourceSettings & {
  default_jurisdictions: string[];
  visa_lead_time_days: number;
  deadline_sla_days: number;
  document_renewal_threshold_days: number;
  risk_weights: Record<RiskWeightKey, number>;
  is_compliance_configured: boolean;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const nowIso = () => new Date().toISOString();

function normalizeNonNegativeInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.round(parsed));
}

function normalizeRiskWeights(value: unknown): Record<RiskWeightKey, number> {
  const candidate = (value || {}) as Record<string, unknown>;
  const merged: Record<RiskWeightKey, number> = { ...DEFAULT_RISK_WEIGHTS };
  for (const key of RISK_WEIGHT_KEYS) {
    const next = Number(candidate[key]);
    if (Number.isFinite(next) && next >= 0) merged[key] = next;
  }
  const total = Object.values(merged).reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) return { ...DEFAULT_RISK_WEIGHTS };
  for (const key of RISK_WEIGHT_KEYS) {
    merged[key] = merged[key] / total;
  }
  return merged;
}

function normalizeComplianceSettings(value: Record<string, unknown> | null): SnapshotComplianceSettings {
  const settings = value || {};
  const fallback = DEFAULT_COMPLIANCE_SETTINGS;
  const jurisdictions = Array.isArray(settings.default_jurisdictions)
    ? settings.default_jurisdictions
        .map((entry) => String(entry || "").trim())
        .filter(Boolean)
    : fallback.default_jurisdictions;
  return {
    prefer_integration_data: Boolean(
      settings.prefer_integration_data ?? fallback.prefer_integration_data
    ),
    prefer_import_data: Boolean(settings.prefer_import_data ?? fallback.prefer_import_data),
    allow_manual_overrides: Boolean(
      settings.allow_manual_overrides ?? fallback.allow_manual_overrides
    ),
    default_jurisdictions: jurisdictions.length > 0 ? jurisdictions : fallback.default_jurisdictions,
    visa_lead_time_days: normalizeNonNegativeInt(
      settings.visa_lead_time_days,
      fallback.visa_lead_time_days
    ),
    deadline_sla_days: normalizeNonNegativeInt(settings.deadline_sla_days, fallback.deadline_sla_days),
    document_renewal_threshold_days: normalizeNonNegativeInt(
      settings.document_renewal_threshold_days,
      fallback.document_renewal_threshold_days
    ),
    risk_weights: normalizeRiskWeights(settings.risk_weights),
    is_compliance_configured: Boolean(
      settings.is_compliance_configured ?? fallback.is_compliance_configured
    ),
  };
}

function daysUntil(dateLike: string | null): number | null {
  if (!dateLike) return null;
  const target = new Date(dateLike);
  if (!Number.isFinite(target.getTime())) return null;
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((target.getTime() - now.getTime()) / msPerDay);
}

type DbErrorLike = {
  code?: string;
  message?: string;
} | null;
type SupabaseClientLike = Awaited<ReturnType<typeof createUserClient>> | ReturnType<typeof createServiceClient>;

function isMissingRelationError(error: DbErrorLike): boolean {
  if (!error) return false;
  if (error.code === "42P01") return true;
  return (error.message || "").toLowerCase().includes("does not exist");
}

function isAccessDeniedError(error: DbErrorLike): boolean {
  if (!error) return false;
  if (error.code === "42501") return true;
  const message = (error.message || "").toLowerCase();
  return message.includes("permission denied") || message.includes("row-level security");
}

function isMissingColumnError(error: DbErrorLike): boolean {
  if (!error) return false;
  if (error.code === "42703") return true;
  const message = (error.message || "").toLowerCase();
  return message.includes("column") && message.includes("does not exist");
}

function toAnnual(value: number): number {
  return value < 100_000 ? value * 12 : value;
}

function scoreStatus(level: number): "Critical" | "High" | "Moderate" | "Low" {
  if (level >= 80) return "Critical";
  if (level >= 60) return "High";
  if (level >= 35) return "Moderate";
  return "Low";
}

function formatShortDate(dateLike: string | null): string {
  if (!dateLike) return "TBD";
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatRelativeTime(dateLike: string | null): string {
  if (!dateLike) return "recently";
  const target = new Date(dateLike).getTime();
  if (!Number.isFinite(target)) return "recently";
  const diffMs = Date.now() - target;
  const hours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
  if (hours < 24) return `${hours}h ago`;
  const days = Math.max(1, Math.round(hours / 24));
  return `${days}d ago`;
}

function formatFileSize(sizeBytes: number | null): string {
  if (!sizeBytes || sizeBytes <= 0) return "N/A";
  const mb = sizeBytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = sizeBytes / 1024;
  return `${Math.max(1, Math.round(kb))} KB`;
}

function applySourcePrecedence<T extends { data_source?: string | null }>(
  rows: T[],
  settings: ComplianceSourceSettings
): T[] {
  if (rows.length === 0) return rows;
  const hasIntegration = rows.some((row) => row.data_source === "integration");
  const hasImport = rows.some((row) => row.data_source === "import");
  const hasManual = rows.some((row) => row.data_source === "manual");
  let selected: "integration" | "import" | "manual" | null = null;
  if (settings.prefer_integration_data && hasIntegration) {
    selected = "integration";
  } else if (settings.prefer_import_data && hasImport) {
    selected = "import";
  } else if (hasManual) {
    selected = "manual";
  }
  if (!selected) return rows;
  if (settings.allow_manual_overrides && selected !== "manual") {
    return rows.filter((row) => row.data_source === selected || row.data_source === "manual");
  }
  return rows.filter((row) => row.data_source === selected);
}

async function queryEmployeesStrict(client: SupabaseClientLike, workspaceId: string) {
  return client
    .from("employees")
    .select("id,level_id,role_id,location_id,base_salary,bonus,equity,status,employment_type")
    .eq("workspace_id", workspaceId)
    .neq("status", "inactive");
}

async function queryEmployeesRelaxed(client: SupabaseClientLike, workspaceId: string) {
  return client
    .from("employees")
    .select("id,level_id,role_id,location_id,base_salary,bonus,equity")
    .eq("workspace_id", workspaceId)
    .neq("status", "inactive");
}

async function loadEmployeesWithFallback(
  primaryClient: SupabaseClientLike,
  workspaceId: string
): Promise<EmployeeRow[]> {
  const strictPrimary = await queryEmployeesStrict(primaryClient, workspaceId);
  if (!strictPrimary.error) return (strictPrimary.data || []) as EmployeeRow[];
  if (isMissingRelationError(strictPrimary.error)) return [];
  if (isAccessDeniedError(strictPrimary.error)) return [];

  if (isMissingColumnError(strictPrimary.error)) {
    const relaxedPrimary = await queryEmployeesRelaxed(primaryClient, workspaceId);
    if (!relaxedPrimary.error) {
      return (relaxedPrimary.data || []).map((row) => ({
        ...(row as Omit<EmployeeRow, "status" | "employment_type">),
        status: "active",
        employment_type: "national",
      }));
    }
    if (isMissingRelationError(relaxedPrimary.error)) return [];
    if (isAccessDeniedError(relaxedPrimary.error)) return [];
  }

  const userClient = await createUserClient();
  const strictUser = await queryEmployeesStrict(userClient, workspaceId);
  if (!strictUser.error) return (strictUser.data || []) as EmployeeRow[];
  if (isMissingRelationError(strictUser.error)) return [];
  if (isAccessDeniedError(strictUser.error)) return [];

  if (isMissingColumnError(strictUser.error)) {
    const relaxedUser = await queryEmployeesRelaxed(userClient, workspaceId);
    if (!relaxedUser.error) {
      return (relaxedUser.data || []).map((row) => ({
        ...(row as Omit<EmployeeRow, "status" | "employment_type">),
        status: "active",
        employment_type: "national",
      }));
    }
    if (isMissingRelationError(relaxedUser.error)) return [];
    if (isAccessDeniedError(relaxedUser.error)) return [];
    throw new Error(relaxedUser.error?.message || "Failed to load employee data");
  }

  throw new Error(strictUser.error?.message || strictPrimary.error?.message || "Failed to load employee data");
}

async function queryBenchmarksStrict(client: SupabaseClientLike, workspaceId: string) {
  return client
    .from("salary_benchmarks")
    .select("role_id,level_id,location_id,p25,p50,p75,valid_from,created_at")
    .eq("workspace_id", workspaceId)
    .order("valid_from", { ascending: false })
    .order("created_at", { ascending: false });
}

async function queryBenchmarksRelaxed(client: SupabaseClientLike, workspaceId: string) {
  return client
    .from("salary_benchmarks")
    .select("role_id,level_id,location_id,p25,p50,p75")
    .eq("workspace_id", workspaceId);
}

async function loadBenchmarksWithFallback(
  primaryClient: SupabaseClientLike,
  workspaceId: string
): Promise<BenchmarkRow[]> {
  const strictPrimary = await queryBenchmarksStrict(primaryClient, workspaceId);
  if (!strictPrimary.error) return (strictPrimary.data || []) as BenchmarkRow[];
  if (isMissingRelationError(strictPrimary.error)) return [];
  if (isAccessDeniedError(strictPrimary.error)) return [];

  if (isMissingColumnError(strictPrimary.error)) {
    const relaxedPrimary = await queryBenchmarksRelaxed(primaryClient, workspaceId);
    if (!relaxedPrimary.error) return (relaxedPrimary.data || []) as BenchmarkRow[];
    if (isMissingRelationError(relaxedPrimary.error)) return [];
    if (isAccessDeniedError(relaxedPrimary.error)) return [];
  }

  const userClient = await createUserClient();
  const strictUser = await queryBenchmarksStrict(userClient, workspaceId);
  if (!strictUser.error) return (strictUser.data || []) as BenchmarkRow[];
  if (isMissingRelationError(strictUser.error)) return [];
  if (isAccessDeniedError(strictUser.error)) return [];

  if (isMissingColumnError(strictUser.error)) {
    const relaxedUser = await queryBenchmarksRelaxed(userClient, workspaceId);
    if (!relaxedUser.error) return (relaxedUser.data || []) as BenchmarkRow[];
    if (isMissingRelationError(relaxedUser.error)) return [];
    if (isAccessDeniedError(relaxedUser.error)) return [];
    throw new Error(relaxedUser.error?.message || "Failed to load benchmark data");
  }

  throw new Error(strictUser.error?.message || strictPrimary.error?.message || "Failed to load benchmark data");
}

export async function refreshComplianceSnapshot(workspaceId: string) {
  let supabase: Awaited<ReturnType<typeof createUserClient>> | ReturnType<typeof createServiceClient>;
  try {
    supabase = createServiceClient();
  } catch {
    // Fall back to authenticated user client so dashboard can still compute live payloads.
    supabase = await createUserClient();
  }

  const [employees, benchmarks] = await Promise.all([
    loadEmployeesWithFallback(supabase, workspaceId),
    loadBenchmarksWithFallback(supabase, workspaceId),
  ]);

  const subsystemWarnings: string[] = [];
  let complianceSettings: SnapshotComplianceSettings = normalizeComplianceSettings(null);
  const complianceSettingsResult = await supabase
    .from("workspace_compliance_settings")
    .select(
      "prefer_integration_data,prefer_import_data,allow_manual_overrides,default_jurisdictions,visa_lead_time_days,deadline_sla_days,document_renewal_threshold_days,risk_weights,is_compliance_configured"
    )
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (!complianceSettingsResult.error && complianceSettingsResult.data) {
    complianceSettings = normalizeComplianceSettings(
      complianceSettingsResult.data as unknown as Record<string, unknown>
    );
  } else if (complianceSettingsResult.error) {
    subsystemWarnings.push(`settings:${complianceSettingsResult.error.message || "query_error"}`);
  }

  const [policyResult, regulatoryResult, deadlineResult, visaResult, docsResult, auditResult] =
    await Promise.all([
      supabase
      .from("compliance_policies")
      .select("id,name,completion_rate,status,data_source")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("compliance_regulatory_updates")
      .select("id,title,description,published_date,status,impact,jurisdiction,data_source")
      .eq("workspace_id", workspaceId)
      .order("published_date", { ascending: false })
      .limit(10),
    supabase
      .from("compliance_deadlines")
      .select("id,due_at,title,type,status,data_source")
      .eq("workspace_id", workspaceId)
      .order("due_at", { ascending: true })
      .limit(12),
    supabase
      .from("compliance_visa_cases")
      .select("id,title,description,status,expires_on,data_source")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false })
      .limit(12),
    supabase
      .from("compliance_documents")
      .select("id,name,doc_type,expiry_date,status,size_bytes,data_source")
      .eq("workspace_id", workspaceId)
      .order("expiry_date", { ascending: true })
      .limit(12),
    supabase
      .from("compliance_audit_events")
      .select("id,action,target,actor,event_time,icon_type,data_source")
      .eq("workspace_id", workspaceId)
      .order("event_time", { ascending: false })
      .limit(20),
    ]);
  if (policyResult.error) subsystemWarnings.push(`policies:${policyResult.error.message || "query_error"}`);
  if (regulatoryResult.error) subsystemWarnings.push(`regulatory:${regulatoryResult.error.message || "query_error"}`);
  if (deadlineResult.error) subsystemWarnings.push(`deadlines:${deadlineResult.error.message || "query_error"}`);
  if (visaResult.error) subsystemWarnings.push(`visa:${visaResult.error.message || "query_error"}`);
  if (docsResult.error) subsystemWarnings.push(`documents:${docsResult.error.message || "query_error"}`);
  if (auditResult.error) subsystemWarnings.push(`audit:${auditResult.error.message || "query_error"}`);

  const policies = applySourcePrecedence(
    (policyResult.error ? [] : policyResult.data || []) as PolicyRow[],
    complianceSettings
  );
  const regulatoryUpdates = applySourcePrecedence(
    (regulatoryResult.error ? [] : regulatoryResult.data || []) as RegulatoryRow[],
    complianceSettings
  );
  const deadlines = applySourcePrecedence(
    (deadlineResult.error ? [] : deadlineResult.data || []) as DeadlineRow[],
    complianceSettings
  );
  const visaCases = applySourcePrecedence(
    (visaResult.error ? [] : visaResult.data || []) as VisaCaseRow[],
    complianceSettings
  );
  const documents = applySourcePrecedence(
    (docsResult.error ? [] : docsResult.data || []) as DocumentRow[],
    complianceSettings
  );
  const auditEvents = applySourcePrecedence(
    (auditResult.error ? [] : auditResult.data || []) as AuditEventRow[],
    complianceSettings
  );

  const benchmarkMap = new Map<string, BenchmarkRow>();
  for (const benchmark of benchmarks) {
    const key = `${benchmark.role_id}::${benchmark.location_id}::${benchmark.level_id}`;
    if (!benchmarkMap.has(key)) {
      benchmarkMap.set(key, benchmark);
    }
  }

  const employeeComparisons = employees.map((employee) => {
    const key = `${employee.role_id}::${employee.location_id}::${employee.level_id}`;
    const benchmark = benchmarkMap.get(key);
    const totalComp =
      Number(employee.base_salary || 0) + Number(employee.bonus || 0) + Number(employee.equity || 0);
    if (!benchmark || Number(benchmark.p50 || 0) <= 0) {
      return {
        employee,
        hasBenchmark: false,
        totalComp,
        marketComparison: 0,
        bandPosition: "in-band" as "below" | "in-band" | "above",
      };
    }

    const p25 = toAnnual(Number(benchmark.p25 || 0));
    const p50 = toAnnual(Number(benchmark.p50 || 0));
    const p75 = toAnnual(Number(benchmark.p75 || 0));
    const marketComparison = p50 > 0 ? ((totalComp - p50) / p50) * 100 : 0;
    const bandPosition = totalComp < p25 ? "below" : totalComp > p75 ? "above" : "in-band";

    return {
      employee,
      hasBenchmark: true,
      totalComp,
      marketComparison,
      bandPosition,
    };
  });

  const benchmarked = employeeComparisons.filter((entry) => entry.hasBenchmark);
  const coveragePct =
    employees.length > 0 ? Math.round((benchmarked.length / Math.max(1, employees.length)) * 100) : 0;
  const inBandPct =
    benchmarked.length > 0
      ? Math.round(
          (benchmarked.filter((entry) => entry.bandPosition === "in-band").length /
            Math.max(1, benchmarked.length)) *
            100
        )
      : 0;
  const outOfBandPct = 100 - inBandPct;

  const nationals = employeeComparisons.filter((entry) => entry.employee.employment_type === "national");
  const expats = employeeComparisons.filter((entry) => entry.employee.employment_type === "expat");
  const avgTotalComp = (group: typeof employeeComparisons) =>
    group.length > 0
      ? group.reduce((sum, entry) => sum + entry.totalComp, 0) / Math.max(1, group.length)
      : 0;

  const nationalAvg = avgTotalComp(nationals);
  const expatAvg = avgTotalComp(expats);
  const parityGapPct =
    nationalAvg > 0 && expatAvg > 0
      ? Math.round((Math.abs(expatAvg - nationalAvg) / Math.max(nationalAvg, expatAvg)) * 1000) / 10
      : 0;

  const levelGroup = new Map<string, number[]>();
  for (const entry of benchmarked) {
    const list = levelGroup.get(entry.employee.level_id) || [];
    list.push(entry.marketComparison);
    levelGroup.set(entry.employee.level_id, list);
  }

  const equityLevels = [...levelGroup.entries()]
    .slice(0, 6)
    .map(([level, values]) => {
      const averageGap = values.reduce((sum, v) => sum + v, 0) / Math.max(1, values.length);
      const absGap = Math.abs(averageGap);
      return {
        level: level.toUpperCase(),
        gap: `${Math.round(absGap * 10) / 10}%`,
        barPercent: clamp(Math.round(100 - absGap * 2), 20, 100),
        direction: averageGap > 3 ? "up" : averageGap < -3 ? "down" : "neutral",
      };
    });

  const policyCompletionPct =
    policies.length > 0
      ? Math.round(
          policies.reduce((sum, policy) => sum + Number(policy.completion_rate || 0), 0) /
            Math.max(1, policies.length)
        )
      : 0;

  const jurisdictionsSet = new Set(
    complianceSettings.default_jurisdictions.map((jurisdiction) => jurisdiction.toLowerCase())
  );
  const regulatoryScoped =
    jurisdictionsSet.size > 0
      ? regulatoryUpdates.filter((row) =>
          !row.jurisdiction ? true : jurisdictionsSet.has(row.jurisdiction.toLowerCase())
        )
      : regulatoryUpdates;

  const now = new Date();
  const deadlineWindow = complianceSettings.deadline_sla_days;
  const docRenewalWindow = complianceSettings.document_renewal_threshold_days;
  const visaRenewalWindow = complianceSettings.visa_lead_time_days;
  const overdueDeadlines = deadlines.filter((deadline) => {
    if (!deadline.due_at) return false;
    return new Date(deadline.due_at).getTime() < now.getTime() && deadline.status !== "done";
  }).length;
  const upcomingDeadlines = deadlines.filter((deadline) => {
    if (!deadline.due_at || deadline.status === "done") return false;
    const days = daysUntil(deadline.due_at);
    return days !== null && days >= 0 && days <= deadlineWindow;
  }).length;
  const expiringDocuments = documents.filter((doc) => {
    const days = daysUntil(doc.expiry_date);
    if (days === null) return doc.status === "Expiring";
    return days <= docRenewalWindow;
  }).length;
  const overduePermits = visaCases.filter((visa) => {
    const days = daysUntil(visa.expires_on);
    return visa.status === "overdue" || (days !== null && days < 0);
  }).length;
  const expiringPermits = visaCases.filter((visa) => {
    const days = daysUntil(visa.expires_on);
    if (days === null) return visa.status === "expiring";
    return days >= 0 && days <= visaRenewalWindow;
  }).length;

  const riskItems = [
    {
      id: "risk-benchmark-coverage",
      area: "Compensation Benchmark Coverage",
      level: clamp(100 - coveragePct, 0, 100),
      status: scoreStatus(clamp(100 - coveragePct, 0, 100)),
      description: `${coveragePct}% of active employees are benchmarked against market data.`,
    },
    {
      id: "risk-out-of-band",
      area: "Out-of-Band Compensation",
      level: clamp(outOfBandPct, 0, 100),
      status: scoreStatus(clamp(outOfBandPct, 0, 100)),
      description: `${outOfBandPct}% of benchmarked employees are outside expected compensation bands.`,
    },
    {
      id: "risk-policy-signoff",
      area: "Policy Sign-off Completion",
      level: clamp(100 - policyCompletionPct, 0, 100),
      status: scoreStatus(clamp(100 - policyCompletionPct, 0, 100)),
      description: `${policyCompletionPct}% average policy completion across tracked controls.`,
    },
    {
      id: "risk-regulatory-deadlines",
      area: "Regulatory Deadlines",
      level: clamp(overdueDeadlines * 20 + upcomingDeadlines * 8, 0, 100),
      status: scoreStatus(clamp(overdueDeadlines * 20 + upcomingDeadlines * 8, 0, 100)),
      description: `${overdueDeadlines} overdue and ${upcomingDeadlines} due within ${deadlineWindow} days.`,
    },
  ];

  const payEquityKpis = [
    {
      id: "pek1",
      label: "Compensation Parity Gap",
      value: `${parityGapPct}%`,
      subtitle: "national vs expat average pay",
      delta: "0.0",
      deltaDirection: "down",
    },
    {
      id: "pek2",
      label: "Equity Score",
      value: `${inBandPct}`,
      subtitle: "share of benchmarked staff in-band",
    },
    {
      id: "pek3",
      label: "Audited Roles",
      value: `${levelGroup.size}`,
      subtitle: "levels with benchmark coverage",
    },
  ];

  const visaStats = [
    { label: "Active Permits", value: `${visaCases.filter((row) => row.status === "active").length}`, color: "brand" },
    { label: `Expiring <${visaRenewalWindow}d`, value: `${expiringPermits}`, color: "amber" },
    { label: "Overdue", value: `${overduePermits}`, color: "red" },
    { label: "Open Cases", value: `${visaCases.filter((row) => row.status === "open_case").length}`, color: "emerald" },
  ];

  const visaTimeline = visaCases.slice(0, 6).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description || (row.expires_on ? `Expiry ${formatShortDate(row.expires_on)}` : "No details"),
    type: row.status === "overdue" ? "Critical" : row.status === "active" ? "Success" : "Update",
  }));

  const documentItems = documents.slice(0, 8).map((row) => ({
    id: row.id,
    name: row.name,
    docType: row.doc_type,
    expiry: formatShortDate(row.expiry_date),
    status: row.status || "Review",
    size: formatFileSize(row.size_bytes),
  }));

  const policyItems = policies.slice(0, 8).map((row) => ({
    id: row.id,
    name: row.name,
    rate: Math.round(Number(row.completion_rate || 0)),
    status: row.status || "Pending",
  }));

  const regulatoryPayload = regulatoryScoped.slice(0, 8).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description || "",
    date: row.published_date || nowIso().slice(0, 10),
    status: row.status || "Pending",
    impact: row.impact || "Medium",
    jurisdiction: row.jurisdiction || "UAE",
  }));

  const deadlineItems = deadlines.slice(0, 8).map((row) => ({
    id: row.id,
    date: formatShortDate(row.due_at),
    title: row.title,
    type: row.type || "Regular",
  }));

  const auditLogItems = auditEvents.slice(0, 10).map((row) => ({
    id: row.id,
    action: row.action,
    target: row.target,
    user: row.actor,
    time: formatRelativeTime(row.event_time),
    iconType: row.icon_type || "risk",
  }));

  const benchmarkCoverageScore = coveragePct;
  const bandScore = inBandPct;
  const policyScore = policyCompletionPct;
  const docsScore = clamp(100 - expiringDocuments * 8, 0, 100);
  const visaScore = clamp(100 - overduePermits * 20, 0, 100);
  const deadlinesScore = clamp(100 - overdueDeadlines * 20 - upcomingDeadlines * 8, 0, 100);
  const weights = complianceSettings.risk_weights;
  const deterministicScore =
    benchmarkCoverageScore * weights.benchmarkCoverage +
    bandScore * weights.outOfBand +
    policyScore * weights.policyCompletion +
    docsScore * weights.documents +
    visaScore * weights.visa +
    deadlinesScore * weights.deadlines;

  const aiResult = await runComplianceAiScoring({
    workspaceId,
    metrics: {
      activeEmployees: employees.length,
      benchmarkCoveragePct: coveragePct,
      inBandPct,
      policyCompletionPct,
      expiringDocuments,
      overduePermits,
      overdueDeadlines,
      upcomingDeadlines,
      expiringPermits,
    },
    riskItems,
  });

  const weightedAiDelta = Math.round((aiResult.scoreDelta * (aiResult.confidence / 100)) * 10) / 10;
  const complianceScore = clamp(
    Math.round((deterministicScore + weightedAiDelta) * 10) / 10,
    0,
    100
  );

  const snapshotPayload = {
    workspace_id: workspaceId,
    compliance_score: complianceScore,
    risk_items: riskItems,
    pay_equity_kpis: payEquityKpis,
    equity_levels: equityLevels,
    policy_items: policyItems,
    regulatory_updates: regulatoryPayload,
    deadline_items: deadlineItems,
    visa_stats: visaStats,
    visa_timeline: visaTimeline,
    document_items: documentItems,
    audit_log_items: auditLogItems,
    ai_scoring_metadata: {
      model: aiResult.model,
      confidence: aiResult.confidence,
      score_delta: aiResult.scoreDelta,
      weighted_delta: weightedAiDelta,
      active_employees: employees.length,
      benchmark_rows: benchmarks.length,
      reasons: aiResult.reasons,
      missing_data: [...aiResult.missingData, ...subsystemWarnings],
      jurisdictions_applied: complianceSettings.default_jurisdictions,
      settings_applied: {
        is_compliance_configured: complianceSettings.is_compliance_configured,
        visa_lead_time_days: visaRenewalWindow,
        deadline_sla_days: deadlineWindow,
        document_renewal_threshold_days: docRenewalWindow,
        risk_weights: weights,
      },
      computed_at: nowIso(),
    },
    updated_at: nowIso(),
  };

  const initialUpsert = await supabase
    .from("compliance_snapshots")
    .upsert(snapshotPayload, { onConflict: "workspace_id" })
    .select("*")
    .single();

  if (!initialUpsert.error && initialUpsert.data) {
    return initialUpsert.data;
  }

  const upsertError = initialUpsert.error;
  if (
    upsertError?.code === "42501" ||
    isMissingRelationError(upsertError) ||
    isAccessDeniedError(upsertError)
  ) {
    // No write permission/table mismatch. Return computed payload anyway.
    return snapshotPayload;
  }

  const isMissingAiColumn =
    upsertError?.code === "42703" ||
    (upsertError?.message || "").includes("ai_scoring_metadata");
  if (!isMissingAiColumn) {
    // Preserve live API output even when persistence schema is incomplete.
    return snapshotPayload;
  }

  const legacyPayload = { ...snapshotPayload };
  delete (legacyPayload as { ai_scoring_metadata?: unknown }).ai_scoring_metadata;
  const legacyUpsert = await supabase
    .from("compliance_snapshots")
    .upsert(legacyPayload, { onConflict: "workspace_id" })
    .select("*")
    .single();

  if (legacyUpsert.error) return legacyPayload;
  return legacyUpsert.data || legacyPayload;
}
