import { createClient } from "@/lib/supabase/server";
import { getAdvisoryModel, getOpenAIClient } from "@/lib/ai/openai";
import { parseEmployeeStructuredAnswer } from "@/lib/ai/chat/protocol";
import { findMarketBenchmark } from "@/lib/benchmarks/platform-market";

type EmployeeRow = {
  id: string;
  workspace_id: string;
  first_name: string;
  last_name: string;
  department: string;
  role_id: string;
  level_id: string;
  location_id: string;
  base_salary: number;
  bonus: number | null;
  equity: number | null;
  currency: string;
  employment_type: "national" | "expat";
  performance_rating: "low" | "meets" | "exceeds" | "exceptional" | null;
  hire_date: string | null;
  last_review_date: string | null;
};

export type EmployeeChatContext = {
  employee: {
    id: string;
    name: string;
    department: string;
    role_id: string;
    level_id: string;
    location_id: string;
    base_salary: number;
    bonus: number;
    equity: number;
    total_comp: number;
    currency: string;
    employment_type: "national" | "expat";
    performance_rating: "low" | "meets" | "exceeds" | "exceptional" | null;
    hire_date: string | null;
    last_review_date: string | null;
  };
  peer_group: {
    count: number;
    median_base_salary: number | null;
    median_total_comp: number | null;
  };
  benchmark: Record<string, unknown> | null;
  compensation_history: Record<string, unknown>[];
  data_gaps: {
    missing_benchmark: boolean;
    missing_equity: boolean;
    missing_performance: boolean;
  };
};

export type GroundedContextInfo = {
  benchmark_used: boolean;
  peer_group_size: number;
  history_points: number;
};

export async function loadEmployeeChatContext(
  workspaceId: string,
  employeeId: string
): Promise<{ context: EmployeeChatContext; grounded: GroundedContextInfo }> {
  const supabase = await createClient();

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", employeeId)
    .single<EmployeeRow>();

  if (employeeError || !employee) {
    throw new Error("Employee not found");
  }

  const { data: peers } = await supabase
    .from("employees")
    .select("id, base_salary, bonus, equity")
    .eq("workspace_id", workspaceId)
    .eq("role_id", employee.role_id)
    .eq("level_id", employee.level_id)
    .eq("location_id", employee.location_id)
    .neq("id", employee.id)
    .limit(25);

  // Market benchmark is the primary source (the Qeemly data pool)
  const marketBenchmark = await findMarketBenchmark(
    supabase,
    employee.role_id,
    employee.location_id,
    employee.level_id
  );

  // Workspace benchmark (company pay bands) as secondary
  const { data: workspaceBenchmark } = await supabase
    .from("salary_benchmarks")
    .select(
      "p10,p25,p50,p75,p90,currency,sample_size,confidence,national_gpssa_pct,national_nafis_pct,national_total_cost_multiplier"
    )
    .eq("workspace_id", workspaceId)
    .eq("role_id", employee.role_id)
    .eq("level_id", employee.level_id)
    .eq("location_id", employee.location_id)
    .order("valid_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  const latestBenchmark = marketBenchmark ?? workspaceBenchmark;

  const { data: compHistory } = await supabase
    .from("compensation_history")
    .select("effective_date,base_salary,bonus,equity,change_percentage")
    .eq("employee_id", employee.id)
    .order("effective_date", { ascending: false })
    .limit(3);

  const peerComp = (peers || []).map((peer) => ({
    totalComp: Number(peer.base_salary || 0) + Number(peer.bonus || 0) + Number(peer.equity || 0),
    baseSalary: Number(peer.base_salary || 0),
  }));

  const peerCount = peerComp.length;
  const sortedByBase = [...peerComp].sort((a, b) => a.baseSalary - b.baseSalary);
  const sortedByTotal = [...peerComp].sort((a, b) => a.totalComp - b.totalComp);
  const midpoint = Math.floor(peerComp.length / 2);

  const employeeTotalComp =
    Number(employee.base_salary || 0) + Number(employee.bonus || 0) + Number(employee.equity || 0);

  const context: EmployeeChatContext = {
    employee: {
      id: employee.id,
      name: `${employee.first_name} ${employee.last_name}`.trim(),
      department: employee.department,
      role_id: employee.role_id,
      level_id: employee.level_id,
      location_id: employee.location_id,
      base_salary: Number(employee.base_salary || 0),
      bonus: Number(employee.bonus || 0),
      equity: Number(employee.equity || 0),
      total_comp: employeeTotalComp,
      currency: employee.currency,
      employment_type: employee.employment_type,
      performance_rating: employee.performance_rating,
      hire_date: employee.hire_date,
      last_review_date: employee.last_review_date,
    },
    peer_group: {
      count: peerCount,
      median_base_salary: peerCount > 0 ? sortedByBase[midpoint].baseSalary : null,
      median_total_comp: peerCount > 0 ? sortedByTotal[midpoint].totalComp : null,
    },
    benchmark: (latestBenchmark as Record<string, unknown> | null) || null,
    compensation_history: (compHistory || []) as Record<string, unknown>[],
    data_gaps: {
      missing_benchmark: !latestBenchmark,
      missing_equity: employee.equity == null,
      missing_performance: !employee.performance_rating,
    },
  };

  return {
    context,
    grounded: {
      benchmark_used: !!latestBenchmark,
      peer_group_size: peerCount,
      history_points: (compHistory || []).length,
    },
  };
}

export function buildEmployeeChatInput(context: EmployeeChatContext, question: string): string {
  return [
    "You are Qeemly Advisory, a compensation co-pilot.",
    "Answer using the provided employee context.",
    "Benchmark data comes from the Qeemly market data pool (aggregated across the GCC region).",
    "If data is missing, explicitly say what is missing.",
    "Be concise, practical, and structured.",
    "",
    `Employee context JSON:\n${JSON.stringify(context, null, 2)}`,
    "",
    `Question: ${question}`,
    "",
    "Return JSON with keys: answer (string), confidence (number 0-100), reasons (string[]), missing_data (string[]).",
  ].join("\n");
}

export async function runEmployeeAdvisoryChat(args: {
  workspaceId: string;
  employeeId: string;
  question: string;
}) {
  const { context, grounded } = await loadEmployeeChatContext(args.workspaceId, args.employeeId);
  const client = getOpenAIClient();
  const model = getAdvisoryModel();
  const response = await client.responses.create({
    model,
    input: buildEmployeeChatInput(context, args.question),
  });
  const parsed = parseEmployeeStructuredAnswer(response.output_text || "");

  return {
    ...parsed,
    model,
    grounded_context: grounded,
  };
}
