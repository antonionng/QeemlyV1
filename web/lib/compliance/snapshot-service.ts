import { createServiceClient } from "@/lib/supabase/service";
import { runComplianceAiScoring } from "@/lib/compliance/ai-scoring";

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
};

type RegulatoryRow = {
  id: string;
  title: string;
  description: string | null;
  published_date: string | null;
  status: "Active" | "Pending" | "Review" | null;
  impact: "High" | "Medium" | "Low" | null;
  jurisdiction: string | null;
};

type DeadlineRow = {
  id: string;
  due_at: string | null;
  title: string;
  type: "Urgent" | "Regular" | "Mandatory" | null;
  status: "open" | "done" | "overdue" | null;
};

type VisaCaseRow = {
  id: string;
  title: string;
  description: string | null;
  status: "active" | "expiring" | "overdue" | "open_case" | null;
  expires_on: string | null;
};

type DocumentRow = {
  id: string;
  name: string;
  doc_type: string;
  expiry_date: string | null;
  status: "Active" | "Review" | "Expiring" | null;
  size_bytes: number | null;
};

type AuditEventRow = {
  id: string;
  action: string;
  target: string;
  actor: string;
  event_time: string | null;
  icon_type: "document" | "policy" | "risk" | "user" | null;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const nowIso = () => new Date().toISOString();

type DbErrorLike = {
  code?: string;
  message?: string;
} | null;

function isMissingRelationError(error: DbErrorLike): boolean {
  if (!error) return false;
  if (error.code === "42P01") return true;
  return (error.message || "").toLowerCase().includes("does not exist");
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

export async function refreshComplianceSnapshot(workspaceId: string) {
  const supabase = createServiceClient();

  const [
    employeesResult,
    benchmarksResult,
    policyResult,
    regulatoryResult,
    deadlineResult,
    visaResult,
    docsResult,
    auditResult,
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("id,level_id,role_id,location_id,base_salary,bonus,equity,status,employment_type")
      .eq("workspace_id", workspaceId)
      .eq("status", "active"),
    supabase
      .from("salary_benchmarks")
      .select("role_id,level_id,location_id,p25,p50,p75,valid_from,created_at")
      .eq("workspace_id", workspaceId)
      .order("valid_from", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("compliance_policies")
      .select("id,name,completion_rate,status")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("compliance_regulatory_updates")
      .select("id,title,description,published_date,status,impact,jurisdiction")
      .eq("workspace_id", workspaceId)
      .order("published_date", { ascending: false })
      .limit(10),
    supabase
      .from("compliance_deadlines")
      .select("id,due_at,title,type,status")
      .eq("workspace_id", workspaceId)
      .order("due_at", { ascending: true })
      .limit(12),
    supabase
      .from("compliance_visa_cases")
      .select("id,title,description,status,expires_on")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false })
      .limit(12),
    supabase
      .from("compliance_documents")
      .select("id,name,doc_type,expiry_date,status,size_bytes")
      .eq("workspace_id", workspaceId)
      .order("expiry_date", { ascending: true })
      .limit(12),
    supabase
      .from("compliance_audit_events")
      .select("id,action,target,actor,event_time,icon_type")
      .eq("workspace_id", workspaceId)
      .order("event_time", { ascending: false })
      .limit(20),
  ]);

  if (employeesResult.error) throw new Error(employeesResult.error.message);
  if (benchmarksResult.error) throw new Error(benchmarksResult.error.message);
  if (policyResult.error && !isMissingRelationError(policyResult.error)) {
    throw new Error(policyResult.error.message);
  }
  if (regulatoryResult.error && !isMissingRelationError(regulatoryResult.error)) {
    throw new Error(regulatoryResult.error.message);
  }
  if (deadlineResult.error && !isMissingRelationError(deadlineResult.error)) {
    throw new Error(deadlineResult.error.message);
  }
  if (visaResult.error && !isMissingRelationError(visaResult.error)) {
    throw new Error(visaResult.error.message);
  }
  if (docsResult.error && !isMissingRelationError(docsResult.error)) {
    throw new Error(docsResult.error.message);
  }
  if (auditResult.error && !isMissingRelationError(auditResult.error)) {
    throw new Error(auditResult.error.message);
  }

  const employees = (employeesResult.data || []) as EmployeeRow[];
  const benchmarks = (benchmarksResult.data || []) as BenchmarkRow[];
  const policies = (policyResult.error ? [] : policyResult.data || []) as PolicyRow[];
  const regulatoryUpdates = (regulatoryResult.error ? [] : regulatoryResult.data || []) as RegulatoryRow[];
  const deadlines = (deadlineResult.error ? [] : deadlineResult.data || []) as DeadlineRow[];
  const visaCases = (visaResult.error ? [] : visaResult.data || []) as VisaCaseRow[];
  const documents = (docsResult.error ? [] : docsResult.data || []) as DocumentRow[];
  const auditEvents = (auditResult.error ? [] : auditResult.data || []) as AuditEventRow[];

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

  const now = new Date();
  const overdueDeadlines = deadlines.filter((deadline) => {
    if (!deadline.due_at) return false;
    return new Date(deadline.due_at).getTime() < now.getTime() && deadline.status !== "done";
  }).length;
  const expiringDocuments = documents.filter((doc) => doc.status === "Expiring").length;
  const overduePermits = visaCases.filter((visa) => visa.status === "overdue").length;

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
      level: clamp(overdueDeadlines * 20, 0, 100),
      status: scoreStatus(clamp(overdueDeadlines * 20, 0, 100)),
      description: `${overdueDeadlines} deadlines are overdue and require immediate action.`,
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
    { label: "Expiring <30d", value: `${visaCases.filter((row) => row.status === "expiring").length}`, color: "amber" },
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

  const regulatoryPayload = regulatoryUpdates.slice(0, 8).map((row) => ({
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
  const deadlinesScore = clamp(100 - overdueDeadlines * 20, 0, 100);
  const deterministicScore =
    benchmarkCoverageScore * 0.2 +
    bandScore * 0.25 +
    policyScore * 0.2 +
    docsScore * 0.1 +
    visaScore * 0.15 +
    deadlinesScore * 0.1;

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
      reasons: aiResult.reasons,
      missing_data: aiResult.missingData,
      computed_at: nowIso(),
    },
    updated_at: nowIso(),
  };

  const initialUpsert = await supabase
    .from("compliance_snapshots")
    .upsert(snapshotPayload, { onConflict: "workspace_id" })
    .select("*")
    .single();

  if (!initialUpsert.error) {
    return initialUpsert.data;
  }

  const isMissingAiColumn =
    initialUpsert.error.code === "42703" ||
    (initialUpsert.error.message || "").includes("ai_scoring_metadata");
  if (!isMissingAiColumn) {
    throw new Error(initialUpsert.error.message);
  }

  const legacyPayload = { ...snapshotPayload };
  delete (legacyPayload as { ai_scoring_metadata?: unknown }).ai_scoring_metadata;
  const legacyUpsert = await supabase
    .from("compliance_snapshots")
    .upsert(legacyPayload, { onConflict: "workspace_id" })
    .select("*")
    .single();

  if (legacyUpsert.error) throw new Error(legacyUpsert.error.message);
  return legacyUpsert.data;
}
