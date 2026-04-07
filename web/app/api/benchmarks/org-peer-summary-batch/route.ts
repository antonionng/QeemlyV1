import { NextRequest, NextResponse } from "next/server";
import { fetchMarketBenchmarks } from "@/lib/benchmarks/platform-market";
import { getOrgPeerSummary } from "@/lib/benchmarks/org-peer-summary";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { jsonServerError, jsonValidationError } from "@/lib/errors/http";

type SummaryEntry = {
  roleId: string;
  locationId: string;
  levelId: string;
  industry?: string | null;
  companySize?: string | null;
};

type RequestBody = {
  entries?: SummaryEntry[];
};

function makeSummaryKey(entry: SummaryEntry): string {
  return [
    entry.roleId,
    entry.locationId,
    entry.levelId,
    entry.industry ?? "",
    entry.companySize ?? "",
  ].join("::");
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as RequestBody | null;
  const entries = Array.isArray(body?.entries) ? body.entries : [];

  if (entries.length === 0) {
    return jsonValidationError({
      message: "Please correct the highlighted fields and try again.",
      fields: { entries: "Add at least one benchmark entry and try again." },
    });
  }

  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const queryClient = wsContext.context.is_override ? createServiceClient() : supabase;
  let marketClient: typeof queryClient = queryClient;
  try {
    marketClient = createServiceClient();
  } catch {
    marketClient = queryClient;
  }

  const [employeesResult, workspaceBenchmarksResult, marketBenchmarks] = await Promise.all([
    queryClient
      .from("employees")
      .select("id,role_id,level_id,location_id,status,base_salary,bonus,equity")
      .eq("workspace_id", wsContext.context.workspace_id)
      .neq("status", "inactive")
      .order("created_at", { ascending: false }),
    queryClient
      .from("salary_benchmarks")
      .select(
        "id,workspace_id,role_id,location_id,level_id,currency,p10,p25,p50,p75,p90,sample_size,source,confidence,pay_period,industry,company_size,valid_from,created_at",
      )
      .eq("workspace_id", wsContext.context.workspace_id)
      .order("valid_from", { ascending: false })
      .order("created_at", { ascending: false }),
    fetchMarketBenchmarks(marketClient, { includeSegmented: true }),
  ]);

  if (employeesResult.error) {
    return jsonServerError(employeesResult.error, {
      defaultMessage: "We could not load your org peer summaries right now.",
      logLabel: "Org peer employees load failed",
    });
  }
  if (workspaceBenchmarksResult.error) {
    return jsonServerError(workspaceBenchmarksResult.error, {
      defaultMessage: "We could not load benchmark data for org peer summaries right now.",
      logLabel: "Org peer benchmarks load failed",
    });
  }

  const employeeRows = (employeesResult.data || []).map((employee) => ({
    id: String(employee.id),
    role_id: String(employee.role_id),
    level_id: String(employee.level_id),
    location_id: String(employee.location_id),
    status: employee.status ? String(employee.status) : null,
    base_salary: employee.base_salary != null ? Number(employee.base_salary) : null,
    bonus: employee.bonus != null ? Number(employee.bonus) : null,
    equity: employee.equity != null ? Number(employee.equity) : null,
  }));

  const workspaceBenchmarks = (workspaceBenchmarksResult.data || []).map((benchmark) => ({
    ...benchmark,
    p10: Number(benchmark.p10),
    p25: Number(benchmark.p25),
    p50: Number(benchmark.p50),
    p75: Number(benchmark.p75),
    p90: Number(benchmark.p90),
    sample_size: benchmark.sample_size != null ? Number(benchmark.sample_size) : null,
  }));

  const summaries = Object.fromEntries(
    entries.map((entry) => [
      makeSummaryKey(entry),
      getOrgPeerSummary({
        employees: employeeRows,
        marketBenchmarks,
        workspaceBenchmarks,
        roleId: entry.roleId,
        locationId: entry.locationId,
        levelId: entry.levelId,
        industry: entry.industry ?? null,
        companySize: entry.companySize ?? null,
      }),
    ]),
  );

  return NextResponse.json({ summaries });
}
