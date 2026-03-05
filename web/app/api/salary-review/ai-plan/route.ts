import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getWorkspaceContext } from "@/lib/workspace-context";
import {
  buildSalaryReviewAiPlan,
  type SalaryReviewAiBenchmarkInput,
  type SalaryReviewAiEmployeeInput,
  type SalaryReviewAiFreshnessInput,
} from "@/lib/salary-review/ai-plan-engine";
import { validateSalaryReviewAiPlanRequest } from "@/lib/salary-review";

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
  source: string | null;
  valid_from: string | null;
  created_at: string;
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
    return NextResponse.json({ error: employeesError.message }, { status: 500 });
  }

  const employeeRows = (employees ?? []) as EmployeeRow[];
  const selectedSet = new Set(validation.value.selectedEmployeeIds ?? []);
  const filteredEmployees = validation.value.selectedEmployeeIds?.length
    ? employeeRows.filter((employee) => selectedSet.has(employee.id))
    : employeeRows;

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
    return NextResponse.json({ error: workspaceBenchmarkError.message }, { status: 500 });
  }

  const { data: ingestionBenchmarkRows, error: ingestionBenchmarkError } = await serviceClient
    .from("salary_benchmarks")
    .select("role_id, level_id, location_id, p50, source, valid_from, created_at")
    .neq("workspace_id", workspace_id)
    .eq("source", "market")
    .order("valid_from", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(8000);

  if (ingestionBenchmarkError) {
    return NextResponse.json({ error: ingestionBenchmarkError.message }, { status: 500 });
  }

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
  const ingestionBenchmarks = dedupeBenchmarks(
    (ingestionBenchmarkRows ?? []) as BenchmarkRow[],
    "ingestion",
    (Array.isArray(allowedIngestionFreshness?.ingestion_sources)
      ? allowedIngestionFreshness?.ingestion_sources[0]?.slug
      : allowedIngestionFreshness?.ingestion_sources?.slug) ?? "qeemly_ingestion",
    (Array.isArray(allowedIngestionFreshness?.ingestion_sources)
      ? allowedIngestionFreshness?.ingestion_sources[0]?.name
      : allowedIngestionFreshness?.ingestion_sources?.name) ?? "Qeemly Ingestion"
  );

  const plan = buildSalaryReviewAiPlan({
    request: validation.value,
    employees: filteredEmployees.map(toEmployeeInput),
    workspaceBenchmarks,
    ingestionBenchmarks,
    freshness,
  });

  return NextResponse.json(plan);
}

