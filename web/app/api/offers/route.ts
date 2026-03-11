import { NextRequest, NextResponse } from "next/server";
import { findMarketBenchmark } from "@/lib/benchmarks/platform-market";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getWorkspaceContext } from "@/lib/workspace-context";
import type { OfferBenchmarkSnapshot } from "@/lib/offers/types";

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
  benchmark_snapshot?: Partial<OfferBenchmarkSnapshot>;
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

type ResolvedOfferBenchmark = {
  source: "market" | "uploaded";
  percentiles: { p10: number; p25: number; p50: number; p75: number; p90: number };
  sampleSize: number;
  confidence: string;
  lastUpdated: string | null;
  freshnessAt: string | null;
  provenance: string | null;
};

function getExpectedOfferValue(
  percentiles: ResolvedOfferBenchmark["percentiles"],
  percentile: number,
): number {
  const { p25, p50, p75, p90 } = percentiles;
  if (percentile <= 25) return p25;
  if (percentile <= 50) return p25 + ((p50 - p25) * (percentile - 25)) / 25;
  if (percentile <= 75) return p50 + ((p75 - p50) * (percentile - 50)) / 25;
  if (percentile <= 90) return p75 + ((p90 - p75) * (percentile - 75)) / 15;
  return p90;
}

async function resolveOfferBenchmark(args: {
  workspaceId: string;
  roleId: string;
  locationId: string;
  levelId: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
}): Promise<ResolvedOfferBenchmark | null> {
  const marketClient = createServiceClient();
  const marketBenchmark = await findMarketBenchmark(
    marketClient,
    args.roleId,
    args.locationId,
    args.levelId,
  );
  if (marketBenchmark) {
    return {
      source: "market",
      percentiles: {
        p10: marketBenchmark.p10,
        p25: marketBenchmark.p25,
        p50: marketBenchmark.p50,
        p75: marketBenchmark.p75,
        p90: marketBenchmark.p90,
      },
      sampleSize: marketBenchmark.sample_size ?? 0,
      confidence: marketBenchmark.sample_size && marketBenchmark.sample_size >= 50 ? "High" : "Medium",
      lastUpdated: marketBenchmark.freshness_at ?? null,
      freshnessAt: marketBenchmark.freshness_at ?? null,
      provenance: marketBenchmark.provenance ?? null,
    };
  }

  const { data: workspaceRows, error } = await args.supabase
    .from("salary_benchmarks")
    .select("p10,p25,p50,p75,p90,sample_size,confidence,created_at")
    .eq("workspace_id", args.workspaceId)
    .eq("role_id", args.roleId)
    .eq("location_id", args.locationId)
    .eq("level_id", args.levelId)
    .order("valid_from", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const row = workspaceRows?.[0];
  if (!row) return null;

  return {
    source: "uploaded",
    percentiles: {
      p10: Number(row.p10),
      p25: Number(row.p25),
      p50: Number(row.p50),
      p75: Number(row.p75),
      p90: Number(row.p90),
    },
    sampleSize: Number(row.sample_size ?? 0),
    confidence: String(row.confidence ?? "Medium"),
    lastUpdated: row.created_at ? String(row.created_at) : null,
    freshnessAt: row.created_at ? String(row.created_at) : null,
    provenance: "workspace",
  };
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
  if (body.export_format && body.export_format !== "JSON") {
    return NextResponse.json(
      { error: "Only JSON offer exports are currently supported." },
      { status: 400 },
    );
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

  const targetPercentile = Number(body.target_percentile);
  if (!Number.isFinite(targetPercentile) || targetPercentile < 25 || targetPercentile > 90) {
    return NextResponse.json({ error: "target_percentile must be between 25 and 90." }, { status: 400 });
  }

  const resolvedBenchmark = await resolveOfferBenchmark({
    workspaceId: workspace_id,
    roleId: body.role_id!,
    locationId: body.location_id!,
    levelId: body.level_id!,
    supabase,
  });

  if (!resolvedBenchmark) {
    return NextResponse.json(
      { error: "No benchmark match found for the requested offer." },
      { status: 400 },
    );
  }

  const expectedOfferValue = Math.round(
    getExpectedOfferValue(resolvedBenchmark.percentiles, targetPercentile),
  );
  const expectedLow = Math.round(expectedOfferValue * 0.96);
  const expectedHigh = Math.round(expectedOfferValue * 1.04);
  const submittedOfferValue = Math.round(Number(body.offer_value));
  const submittedLow = Math.round(Number(body.offer_low));
  const submittedHigh = Math.round(Number(body.offer_high));

  if (
    !Number.isFinite(submittedOfferValue) ||
    !Number.isFinite(submittedLow) ||
    !Number.isFinite(submittedHigh)
  ) {
    return NextResponse.json({ error: "Offer values must be numeric." }, { status: 400 });
  }
  if (submittedLow > submittedOfferValue || submittedOfferValue > submittedHigh) {
    return NextResponse.json(
      { error: "Offer range is invalid. Expected low <= value <= high." },
      { status: 400 },
    );
  }
  if (
    submittedOfferValue !== expectedOfferValue ||
    submittedLow !== expectedLow ||
    submittedHigh !== expectedHigh
  ) {
    return NextResponse.json(
      {
        error:
          "Offer math does not match the current benchmark. Refresh the benchmark and retry.",
      },
      { status: 400 },
    );
  }

  const clientSnapshot = body.benchmark_snapshot ?? {};
  const benchmarkSnapshot: OfferBenchmarkSnapshot = {
    benchmark_percentiles: resolvedBenchmark.percentiles,
    benchmark_source: resolvedBenchmark.source,
    sample_size: resolvedBenchmark.sampleSize,
    confidence: resolvedBenchmark.confidence,
    last_updated: resolvedBenchmark.lastUpdated,
    freshness_at: resolvedBenchmark.freshnessAt,
    provenance: resolvedBenchmark.provenance,
    role:
      clientSnapshot.role && typeof clientSnapshot.role === "object"
        ? (clientSnapshot.role as Record<string, unknown>)
        : { id: body.role_id },
    level:
      clientSnapshot.level && typeof clientSnapshot.level === "object"
        ? (clientSnapshot.level as Record<string, unknown>)
        : { id: body.level_id },
    location:
      clientSnapshot.location && typeof clientSnapshot.location === "object"
        ? (clientSnapshot.location as Record<string, unknown>)
        : { id: body.location_id },
    form_data:
      clientSnapshot.form_data && typeof clientSnapshot.form_data === "object"
        ? (clientSnapshot.form_data as Record<string, unknown>)
        : {},
  };

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
    target_percentile: targetPercentile,
    offer_value: submittedOfferValue,
    offer_low: submittedLow,
    offer_high: submittedHigh,
    currency: body.currency!,
    salary_breakdown: body.salary_breakdown || {},
    benchmark_snapshot: benchmarkSnapshot,
    export_format: "JSON",
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
