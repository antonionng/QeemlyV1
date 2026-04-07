import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { LEVELS, ROLES } from "@/lib/dashboard/dummy-data";

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  ic1: "Entry level. 0-1 years experience.",
  ic2: "Mid-level. 2-4 years experience. Works independently and owns defined scope.",
  ic3: "Senior. Deep contributor with broad ownership.",
  ic4: "Lead/Staff. Drives cross-team execution and technical direction.",
  m1: "Manager. Leads people delivery and team execution.",
  m2: "Senior Manager. Leads managers and larger organizational scope.",
};

export async function GET() {
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const supabase = await createClient();
  const queryClient = wsContext.context.is_override ? createServiceClient() : supabase;
  const workspaceId = wsContext.context.workspace_id;

  const roleIds = new Set<string>(ROLES.map((role) => role.id));
  const levelIds = new Set<string>(LEVELS.map((level) => level.id));

  const [employeeIdsResult, benchmarkIdsResult] = await Promise.all([
    queryClient
      .from("employees")
      .select("role_id,level_id")
      .eq("workspace_id", workspaceId)
      .limit(1000),
    queryClient
      .from("salary_benchmarks")
      .select("role_id,level_id")
      .eq("workspace_id", workspaceId)
      .limit(1000),
  ]);

  for (const row of employeeIdsResult.data || []) {
    if (row.role_id) roleIds.add(String(row.role_id));
    if (row.level_id) levelIds.add(String(row.level_id));
  }
  for (const row of benchmarkIdsResult.data || []) {
    if (row.role_id) roleIds.add(String(row.role_id));
    if (row.level_id) levelIds.add(String(row.level_id));
  }

  const roleLabelById = new Map(ROLES.map((role) => [role.id, role.title]));
  const levelLabelById = new Map(LEVELS.map((level) => [level.id, level.name]));

  const roles = Array.from(roleIds)
    .sort()
    .map((id) => ({
      id,
      label: roleLabelById.get(id) ?? id,
    }));

  const levels = Array.from(levelIds)
    .sort()
    .map((id) => ({
      id,
      label: levelLabelById.get(id) ?? id.toUpperCase(),
      description: LEVEL_DESCRIPTIONS[id] ?? "Qeemly standardized level.",
    }));

  return NextResponse.json({ roles, levels });
}
