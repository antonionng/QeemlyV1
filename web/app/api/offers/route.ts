import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace-context";

type RecipientMode = "employee" | "manual";

type OfferCreateBody = {
  employee_id?: string | null;
  recipient_name?: string | null;
  recipient_email?: string | null;
  role_id?: string;
  level_id?: string;
  location_id?: string;
  employment_type?: "national" | "expat";
  target_percentile?: number;
  offer_value?: number;
  offer_low?: number;
  offer_high?: number;
  currency?: string;
  salary_breakdown?: Record<string, unknown>;
  benchmark_snapshot?: Record<string, unknown>;
  export_format?: "PDF" | "DOCX" | "JSON";
  status?: "draft" | "ready" | "sent" | "archived";
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildExportPayload(offer: Record<string, unknown>) {
  return {
    version: "offer_export_v1",
    generated_at: new Date().toISOString(),
    offer,
  };
}

function resolveRecipientMode(body: OfferCreateBody): RecipientMode | null {
  const hasEmployee = Boolean(body.employee_id);
  const hasManual = Boolean(body.recipient_name && body.recipient_email);
  if (hasEmployee && !hasManual) return "employee";
  if (!hasEmployee && hasManual) return "manual";
  return null;
}

export async function GET() {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { workspace_id } = wsContext.context;
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .eq("workspace_id", workspace_id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ offers: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { workspace_id, user_id } = wsContext.context;
  const body = (await request.json()) as OfferCreateBody;

  const requiredFields: Array<keyof OfferCreateBody> = [
    "role_id",
    "level_id",
    "location_id",
    "employment_type",
    "target_percentile",
    "offer_value",
    "offer_low",
    "offer_high",
    "currency",
  ];
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  const mode = resolveRecipientMode(body);
  if (!mode) {
    return NextResponse.json(
      { error: "Provide either employee_id or recipient_name + recipient_email." },
      { status: 400 }
    );
  }

  if (mode === "manual" && body.recipient_email && !isValidEmail(body.recipient_email)) {
    return NextResponse.json({ error: "recipient_email is invalid." }, { status: 400 });
  }

  let employeeId: string | null = null;
  if (mode === "employee" && body.employee_id) {
    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("id", body.employee_id)
      .eq("workspace_id", workspace_id)
      .single();

    if (!employee) {
      return NextResponse.json({ error: "Employee not found in workspace." }, { status: 400 });
    }
    employeeId = employee.id;
  }

  const insertPayload = {
    workspace_id,
    employee_id: employeeId,
    created_by: user_id,
    recipient_name: mode === "manual" ? body.recipient_name ?? null : null,
    recipient_email: mode === "manual" ? body.recipient_email ?? null : null,
    role_id: body.role_id!,
    level_id: body.level_id!,
    location_id: body.location_id!,
    employment_type: body.employment_type!,
    target_percentile: Number(body.target_percentile),
    offer_value: Number(body.offer_value),
    offer_low: Number(body.offer_low),
    offer_high: Number(body.offer_high),
    currency: body.currency!,
    salary_breakdown: body.salary_breakdown || {},
    benchmark_snapshot: body.benchmark_snapshot || {},
    export_format: body.export_format || "JSON",
    status: body.status || "draft",
  };

  const { data, error } = await supabase
    .from("offers")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      offer: data,
      export_payload: buildExportPayload(data as unknown as Record<string, unknown>),
    },
    { status: 201 }
  );
}
