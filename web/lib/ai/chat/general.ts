import { createClient } from "@/lib/supabase/server";
import type { WorkspaceContext } from "@/lib/workspace-context";

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
  const snapshot = await getWorkspaceSnapshot(workspaceContext.workspace_id);
  const todayIso = new Date().toISOString().slice(0, 10);

  return [
    "You are Qeemly AI, a GCC-focused compensation sidekick.",
    "Give concise, practical answers.",
    "Use only provided workspace snapshot details as facts about this customer.",
    "If a requested fact is unavailable, say so clearly and provide a safe next step.",
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
    "",
    `User question: ${question}`,
    "",
    "Return plain text only.",
  ].join("\n");
}
