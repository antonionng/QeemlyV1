import { NextResponse } from "next/server";
import { fetchMarketBenchmarks } from "@/lib/benchmarks/platform-market";
import { buildAiBenchmarkRows } from "@/lib/benchmarks/ai-benchmark-rows";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getWorkspaceContext } from "@/lib/workspace-context";
import {
  buildSalaryReviewAiPlan,
  buildSalaryReviewAiScenarios,
  type SalaryReviewAiBenchmarkInput,
  type SalaryReviewAiEmployeeInput,
  type SalaryReviewAiFreshnessInput,
} from "@/lib/salary-review/ai-plan-engine";
import { generateSalaryReviewAiRationale, generateScenarioRationale } from "@/lib/salary-review/ai-rationale";
import { validateSalaryReviewAiPlanRequest } from "@/lib/salary-review";
import { jsonServerError } from "@/lib/errors/http";

type EmployeeRow = {
  id: string;
  first_name: string;
  last_name: string;
  role_id: string;
  level_id: string;
  location_id: string;
  base_salary: number | null;
  performance_rating: "low" | "meets" | "exceeds" | "exceptional" | null;
  hire_date: string | null;
  status: "active" | "inactive";
};

type BenchmarkRow = {
  role_id: string;
  level_id: string;
  location_id: string;
  p50: number | null;
};

type FreshnessRow = {
  source_id: string | null;
  last_updated_at: string | null;
  confidence: "high" | "medium" | "low" | null;
  ingestion_sources:
    | {
    slug: string;
    name: string;
    approved_for_commercial: boolean;
    needs_review: boolean;
    enabled: boolean;
  }
    | {
        slug: string;
        name: string;
        approved_for_commercial: boolean;
        needs_review: boolean;
        enabled: boolean;
      }[]
    | null;
};

type WorkspaceSettingsRow = {
  industry: string | null;
  company_size: string | null;
};

function inferCompanySize(headcount: number): string | null {
  if (headcount <= 0) return null;
  if (headcount <= 50) return "1-50";
  if (headcount <= 200) return "51-200";
  if (headcount <= 500) return "201-500";
  if (headcount <= 1000) return "501-1000";
  return "1000+";
}

function toEmployeeInput(row: EmployeeRow): SalaryReviewAiEmployeeInput {
  return {
    id: row.id,
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    roleId: row.role_id,
    levelId: row.level_id,
    locationId: row.location_id,
    baseSalary: Number(row.base_salary) || 0,
    performanceRating: row.performance_rating,
    hireDate: row.hire_date,
  };
}

function dedupeBenchmarks(
  rows: BenchmarkRow[],
  provenance: "workspace" | "ingestion",
  sourceSlug: string | null,
  sourceName: string | null
): SalaryReviewAiBenchmarkInput[] {
  const map = new Map<string, SalaryReviewAiBenchmarkInput>();
  for (const row of rows) {
    const key = `${row.role_id}::${row.location_id}::${row.level_id}`;
    if (map.has(key)) continue;
    const p50 = Number(row.p50) || 0;
    if (p50 <= 0) continue;
    map.set(key, {
      roleId: row.role_id,
      levelId: row.level_id,
      locationId: row.location_id,
      p50,
      provenance,
      sourceSlug,
      sourceName,
    });
  }
  return [...map.values()];
}

export async function POST(request: Request) {
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const body = await request.json().catch(() => null);
  const validation = validateSalaryReviewAiPlanRequest(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const { workspace_id, is_override } = wsContext.context;
  const userClient = is_override ? createServiceClient() : await createClient();
  const serviceClient = createServiceClient();

  const { data: employees, error: employeesError } = await userClient
    .from("employees")
    .select(
      "id, first_name, last_name, role_id, level_id, location_id, base_salary, performance_rating, hire_date, status"
    )
    .eq("workspace_id", workspace_id)
    .eq("status", "active");

  if (employeesError) {
    return jsonServerError(employeesError, {
      defaultMessage: "We could not load employees for this salary review plan.",
      logLabel: "Salary review AI plan employees load failed",
    });
  }

  const employeeRows = (employees ?? []) as EmployeeRow[];
  const selectedSet = new Set(validation.value.selectedEmployeeIds ?? []);
  const filteredEmployees = validation.value.selectedEmployeeIds?.length
    ? employeeRows.filter((employee) => selectedSet.has(employee.id))
    : employeeRows;

  let workspaceSettings: WorkspaceSettingsRow | null = null;
  try {
    const { data } = await serviceClient
      .from("workspace_settings")
      .select("industry, company_size")
      .eq("workspace_id", workspace_id)
      .maybeSingle();
    workspaceSettings = (data as WorkspaceSettingsRow | null) ?? null;
  } catch {
    workspaceSettings = null;
  }

  const roleIds = [...new Set(filteredEmployees.map((employee) => employee.role_id))];
  const levelIds = [...new Set(filteredEmployees.map((employee) => employee.level_id))];
  const locationIds = [...new Set(filteredEmployees.map((employee) => employee.location_id))];

  const fetchBenchmarksForWorkspace = async (targetWorkspaceId: string) => {
    let query = serviceClient
      .from("salary_benchmarks")
      .select("role_id, level_id, location_id, p50, source, valid_from, created_at")
      .eq("workspace_id", targetWorkspaceId)
      .order("valid_from", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5000);

    if (roleIds.length > 0) query = query.in("role_id", roleIds);
    if (levelIds.length > 0) query = query.in("level_id", levelIds);
    if (locationIds.length > 0) query = query.in("location_id", locationIds);

    return query;
  };

  const { data: workspaceBenchmarkRows, error: workspaceBenchmarkError } = await fetchBenchmarksForWorkspace(
    workspace_id
  );
  if (workspaceBenchmarkError) {
    return jsonServerError(workspaceBenchmarkError, {
      defaultMessage: "We could not load benchmark data for this salary review plan.",
      logLabel: "Salary review AI plan benchmarks load failed",
    });
  }

  const marketBenchmarkRows = await (async () => {
    try {
      const aiBenchmarks = await buildAiBenchmarkRows(
        filteredEmployees.map((employee) => ({
          roleId: employee.role_id,
          locationId: employee.location_id,
          industry: workspaceSettings?.industry ?? null,
          companySize: workspaceSettings?.company_size ?? inferCompanySize(employeeRows.length),
        })),
      );
      if (aiBenchmarks.length > 0) {
        return aiBenchmarks.filter((row) => {
          const roleMatch = roleIds.length === 0 || roleIds.includes(row.role_id);
          const levelMatch = levelIds.length === 0 || levelIds.includes(row.level_id);
          const locationMatch = locationIds.length === 0 || locationIds.includes(row.location_id);
          return roleMatch && levelMatch && locationMatch;
        });
      }
    } catch {
      // Fall back to pooled market rows.
    }

    return (await fetchMarketBenchmarks(serviceClient)).filter((row) => {
      const roleMatch = roleIds.length === 0 || roleIds.includes(row.role_id);
      const levelMatch = levelIds.length === 0 || levelIds.includes(row.level_id);
      const locationMatch = locationIds.length === 0 || locationIds.includes(row.location_id);
      return roleMatch && levelMatch && locationMatch;
    });
  })();

  const { data: freshnessRows } = await serviceClient
    .from("data_freshness_metrics")
    .select(
      "source_id, last_updated_at, confidence, ingestion_sources(slug, name, approved_for_commercial, needs_review, enabled)"
    )
    .eq("metric_type", "benchmarks")
    .order("last_updated_at", { ascending: false })
    .limit(200);

  const typedFreshnessRows = (freshnessRows ?? []) as FreshnessRow[];
  const allowedIngestionFreshness = typedFreshnessRows.find((row) => {
    const source = Array.isArray(row.ingestion_sources)
      ? row.ingestion_sources[0]
      : row.ingestion_sources;
    if (!source) return false;
    return source.enabled && source.approved_for_commercial && !source.needs_review;
  });

  const freshness: SalaryReviewAiFreshnessInput[] = [
    {
      provenance: "workspace",
      lastUpdatedAt:
        typedFreshnessRows.find((row) => row.source_id == null)?.last_updated_at ?? null,
      confidence:
        typedFreshnessRows.find((row) => row.source_id == null)?.confidence ?? "unknown",
    },
    {
      provenance: "ingestion",
      lastUpdatedAt: allowedIngestionFreshness?.last_updated_at ?? null,
      confidence: allowedIngestionFreshness?.confidence ?? "unknown",
    },
  ];

  const workspaceBenchmarks = dedupeBenchmarks(
    (workspaceBenchmarkRows ?? []) as BenchmarkRow[],
    "workspace",
    "workspace_uploaded",
    "Workspace Benchmarks"
  );
  const usingAiBenchmarks = marketBenchmarkRows.some(
    (row) => (row as { source?: string | null }).source === "ai-estimated",
  );
  const ingestionBenchmarks = dedupeBenchmarks(
    marketBenchmarkRows as BenchmarkRow[],
    "ingestion",
    usingAiBenchmarks
      ? "qeemly_ai_benchmark"
      : (Array.isArray(allowedIngestionFreshness?.ingestion_sources)
          ? allowedIngestionFreshness?.ingestion_sources[0]?.slug
          : allowedIngestionFreshness?.ingestion_sources?.slug) ?? "qeemly_ingestion",
    usingAiBenchmarks
      ? "Qeemly AI Benchmark"
      : (Array.isArray(allowedIngestionFreshness?.ingestion_sources)
          ? allowedIngestionFreshness?.ingestion_sources[0]?.name
          : allowedIngestionFreshness?.ingestion_sources?.name) ?? "Qeemly Ingestion"
  );

  const employeeInputs = filteredEmployees.map(toEmployeeInput);
  const reviewContext = {
    industry: workspaceSettings?.industry ?? null,
    companySize: workspaceSettings?.company_size ?? inferCompanySize(employeeRows.length),
  };

  const hasStrategyInputs = Boolean(
    validation.value.objective || validation.value.budgetIntent || validation.value.populationRules,
  );

  if (hasStrategyInputs) {
    const scenarioResponse = buildSalaryReviewAiScenarios({
      request: validation.value,
      employees: employeeInputs,
      workspaceBenchmarks,
      ingestionBenchmarks,
      freshness,
    });

    const enriched = await generateScenarioRationale({
      request: validation.value,
      employees: employeeInputs,
      scenarioResponse,
      reviewContext,
    });

    return NextResponse.json(enriched ?? scenarioResponse);
  }

  const plan = buildSalaryReviewAiPlan({
    request: validation.value,
    employees: employeeInputs,
    workspaceBenchmarks,
    ingestionBenchmarks,
    freshness,
  });

  const aiRationale = await generateSalaryReviewAiRationale({
    request: validation.value,
    employees: employeeInputs,
    plan,
    reviewContext,
  });

  if (!aiRationale) {
    return NextResponse.json(plan);
  }

  const rationaleByEmployeeId = new Map(
    aiRationale.items.map((item) => [item.employeeId, item.aiRationale]),
  );

  return NextResponse.json({
    ...plan,
    strategicSummary: aiRationale.strategicSummary,
    items: plan.items.map((item) => ({
      ...item,
      aiRationale: rationaleByEmployeeId.get(item.employeeId) ?? null,
    })),
  });
}

