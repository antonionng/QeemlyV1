import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getWorkspaceContext } from "@/lib/workspace-context";
import {
  generateEmployeeSalaryReviewAdvisory,
  type EmployeeAdvisoryInput,
} from "@/lib/salary-review/employee-advisory";

type RequestBody = {
  employee?: EmployeeAdvisoryInput;
};

function isEmployeeAdvisoryInput(value: unknown): value is EmployeeAdvisoryInput {
  if (!value || typeof value !== "object") return false;
  const employee = value as Partial<EmployeeAdvisoryInput>;
  return (
    typeof employee.id === "string" &&
    typeof employee.firstName === "string" &&
    typeof employee.lastName === "string" &&
    typeof employee.roleName === "string" &&
    typeof employee.levelName === "string" &&
    typeof employee.locationName === "string" &&
    typeof employee.department === "string" &&
    typeof employee.baseSalary === "number" &&
    (employee.bandPosition === "below" ||
      employee.bandPosition === "in-band" ||
      employee.bandPosition === "above") &&
    typeof employee.bandPercentile === "number" &&
    typeof employee.marketComparison === "number" &&
    typeof employee.tenureLabel === "string" &&
    typeof employee.proposedIncrease === "number" &&
    !!employee.benchmark &&
    typeof employee.benchmark === "object"
  );
}

export async function POST(request: Request) {
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const body = (await request.json().catch(() => null)) as RequestBody | null;
  if (!body?.employee || !isEmployeeAdvisoryInput(body.employee)) {
    return NextResponse.json({ error: "Invalid employee advisory payload" }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  let industry: string | null = null;
  let companySize: string | null = null;

  try {
    const { data } = await serviceClient
      .from("workspace_settings")
      .select("industry, company_size")
      .eq("workspace_id", wsContext.context.workspace_id)
      .maybeSingle();
    industry = (data as { industry?: string | null } | null)?.industry ?? null;
    companySize = (data as { company_size?: string | null } | null)?.company_size ?? null;
  } catch {
    industry = null;
    companySize = null;
  }

  const advisory = await generateEmployeeSalaryReviewAdvisory({
    employee: body.employee,
    reviewContext: {
      industry,
      companySize,
    },
  });

  return NextResponse.json({
    summary: advisory?.summary ?? null,
  });
}
