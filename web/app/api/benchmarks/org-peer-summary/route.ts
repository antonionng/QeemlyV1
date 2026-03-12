import { NextRequest, NextResponse } from "next/server";
import { fetchMarketBenchmarks } from "@/lib/benchmarks/platform-market";
import { getOrgPeerSummary } from "@/lib/benchmarks/org-peer-summary";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace-context";

function getRequiredParam(searchParams: URLSearchParams, key: string): string | null {
  const value = searchParams.get(key)?.trim();
  return value ? value : null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roleId = getRequiredParam(searchParams, "roleId");
  const locationId = getRequiredParam(searchParams, "locationId");
  const levelId = getRequiredParam(searchParams, "levelId");
  const industry = getRequiredParam(searchParams, "industry");
  const companySize = getRequiredParam(searchParams, "companySize");

  if (!roleId || !locationId || !levelId) {
    return NextResponse.json(
      { error: "roleId, locationId, and levelId are required." },
      { status: 400 },
    );
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
        "id,workspace_id,role_id,location_id,level_id,currency,p10,p25,p50,p75,p90,sample_size,source,confidence,industry,company_size,valid_from,created_at",
      )
      .eq("workspace_id", wsContext.context.workspace_id)
      .order("valid_from", { ascending: false })
      .order("created_at", { ascending: false }),
    fetchMarketBenchmarks(marketClient, { includeSegmented: true }),
  ]);

  if (employeesResult.error) {
    return NextResponse.json({ error: employeesResult.error.message }, { status: 500 });
  }
  if (workspaceBenchmarksResult.error) {
    return NextResponse.json({ error: workspaceBenchmarksResult.error.message }, { status: 500 });
  }

  const summary = getOrgPeerSummary({
    employees: (employeesResult.data || []).map((employee) => ({
      id: String(employee.id),
      role_id: String(employee.role_id),
      level_id: String(employee.level_id),
      location_id: String(employee.location_id),
      status: employee.status ? String(employee.status) : null,
      base_salary: employee.base_salary != null ? Number(employee.base_salary) : null,
      bonus: employee.bonus != null ? Number(employee.bonus) : null,
      equity: employee.equity != null ? Number(employee.equity) : null,
    })),
    marketBenchmarks,
    workspaceBenchmarks: (workspaceBenchmarksResult.data || []).map((benchmark) => ({
      ...benchmark,
      p10: Number(benchmark.p10),
      p25: Number(benchmark.p25),
      p50: Number(benchmark.p50),
      p75: Number(benchmark.p75),
      p90: Number(benchmark.p90),
      sample_size: benchmark.sample_size != null ? Number(benchmark.sample_size) : null,
    })),
    roleId,
    locationId,
    levelId,
    industry,
    companySize,
  });

  return NextResponse.json(summary);
}
