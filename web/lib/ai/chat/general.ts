import { createClient } from "@/lib/supabase/server";
import type { WorkspaceContext } from "@/lib/workspace-context";
import { fetchMarketBenchmarks } from "@/lib/benchmarks/platform-market";

type WorkspaceSnapshot = {
  employeeCount: number;
  averageBaseSalary: number | null;
  benchmarkCount: number;
};

async function getWorkspaceSnapshot(workspaceId: string): Promise<WorkspaceSnapshot> {
  const supabase = await createClient();

  const [{ count: employeeCount }, { count: benchmarkCount }, avgSalaryResult] = await Promise.all([
    supabase.from("employees").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase
      .from("salary_benchmarks")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId),
    supabase.from("employees").select("base_salary").eq("workspace_id", workspaceId).limit(200),
  ]);

  const salaryRows = avgSalaryResult.data || [];
  const averageBaseSalary =
    salaryRows.length > 0
      ? Math.round(
          salaryRows.reduce((sum, row) => sum + Number(row.base_salary || 0), 0) / salaryRows.length
        )
      : null;

  return {
    employeeCount: employeeCount || 0,
    averageBaseSalary,
    benchmarkCount: benchmarkCount || 0,
  };
}

export async function buildGeneralChatInput(
  workspaceContext: WorkspaceContext,
  question: string
): Promise<string> {
  const supabase = await createClient();
  const [snapshot, marketBenchmarks] = await Promise.all([
    getWorkspaceSnapshot(workspaceContext.workspace_id),
    fetchMarketBenchmarks(supabase).catch(() => []),
  ]);
  const todayIso = new Date().toISOString().slice(0, 10);

  const sections = [
    "You are Qeemly AI, a GCC-focused compensation sidekick.",
    "Give concise, practical answers.",
    "Use the workspace snapshot for facts about this customer's organisation.",
    "Use the Qeemly Market Data to answer questions about market rates, salary comparisons across roles, levels, and locations.",
    "If data for a specific combination is not in the market data, say what is available and suggest the closest match.",
    "",
    "Workspace snapshot (do not invent missing values):",
    JSON.stringify(
      {
        workspace_id: workspaceContext.workspace_id,
        today: todayIso,
        employee_count: snapshot.employeeCount,
        average_base_salary: snapshot.averageBaseSalary,
        benchmark_count: snapshot.benchmarkCount,
      },
      null,
      2
    ),
  ];

  if (marketBenchmarks.length > 0) {
    const condensed = marketBenchmarks.map((b) => ({
      role: b.role_id,
      location: b.location_id,
      level: b.level_id,
      currency: b.currency,
      p25: b.p25,
      p50: b.p50,
      p75: b.p75,
    }));
    sections.push(
      "",
      `Qeemly Market Data (${condensed.length} benchmarks — p25/p50/p75 are annual base salary):`,
      JSON.stringify(condensed, null, 2),
    );
  }

  sections.push(
    "",
    `User question: ${question}`,
    "",
    "Return plain text only with clean formatting:",
    "- Start with a one-line direct answer.",
    "- Use short sections and bullet points for actions.",
    "- Put each bullet on its own new line.",
  );

  return sections.join("\n");
}
