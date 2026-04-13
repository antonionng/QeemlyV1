import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getWorkspaceContext } from "@/lib/workspace-context";
import type { OfferBenchmarkSnapshot, OfferMode } from "@/lib/offers/types";
import { jsonServerError } from "@/lib/errors/http";

type RecipientMode = "employee" | "manual";

const VALID_OFFER_MODES: OfferMode[] = [
  "candidate_manual",
  "candidate_advised",
  "internal",
];

type OfferCreateBody = {
  offer_mode?: OfferMode;
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
  internal_metadata?: Record<string, unknown>;
  advised_baseline?: Record<string, unknown> | null;
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

type OfferPercentiles = { p10: number; p25: number; p50: number; p75: number; p90: number };

function getExpectedOfferValue(
  percentiles: OfferPercentiles,
  percentile: number,
): number {
  const { p25, p50, p75, p90 } = percentiles;
  if (percentile <= 25) return p25;
  if (percentile <= 50) return p25 + ((p50 - p25) * (percentile - 25)) / 25;
  if (percentile <= 75) return p50 + ((p75 - p50) * (percentile - 50)) / 25;
  if (percentile <= 90) return p75 + ((p90 - p75) * (percentile - 75)) / 15;
  return p90;
}


export async function GET() {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { workspace_id, is_override } = wsContext.context;
  const queryClient = is_override ? createServiceClient() : supabase;
  const { data, error } = await queryClient
    .from("offers")
    .select("*")
    .eq("workspace_id", workspace_id)
    .order("created_at", { ascending: false });

  if (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not load your offers right now.",
      logLabel: "Offers load failed",
    });
  }

  return NextResponse.json({ offers: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { workspace_id, user_id, is_override } = wsContext.context;
  const queryClient = is_override ? createServiceClient() : supabase;
  const body = (await request.json()) as OfferCreateBody;

  const offerMode: OfferMode = body.offer_mode || "candidate_advised";
  if (!VALID_OFFER_MODES.includes(offerMode)) {
    return NextResponse.json(
      { error: "offer_mode must be candidate_manual, candidate_advised, or internal." },
      { status: 400 },
    );
  }

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

  const recipientMode = resolveRecipientMode(body);
  if (offerMode !== "internal" && !recipientMode) {
    return NextResponse.json(
      { error: "Provide either employee_id or recipient_name + recipient_email." },
      { status: 400 },
    );
  }

  if (recipientMode === "manual" && body.recipient_email && !isValidEmail(body.recipient_email)) {
    return NextResponse.json({ error: "recipient_email is invalid." }, { status: 400 });
  }
  if (body.export_format && !["JSON", "PDF"].includes(body.export_format)) {
    return NextResponse.json(
      { error: "Supported export formats are JSON and PDF." },
      { status: 400 },
    );
  }

  let employeeId: string | null = null;
  if (recipientMode === "employee" && body.employee_id) {
    const { data: employee } = await queryClient
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

  let offerValue: number;
  let offerLow: number;
  let offerHigh: number;
  let benchmarkSnapshot: OfferBenchmarkSnapshot;
  let advisedBaseline: Record<string, unknown> | null = null;

  if (offerMode === "candidate_manual") {
    offerValue = Math.round(Number(body.offer_value));
    offerLow = Math.round(Number(body.offer_low));
    offerHigh = Math.round(Number(body.offer_high));

    const clientSnapshot = body.benchmark_snapshot ?? {};
    benchmarkSnapshot = {
      benchmark_percentiles: (clientSnapshot.benchmark_percentiles as Record<string, number>) || {},
      benchmark_source: "market",
      sample_size: 0,
      confidence: "N/A",
      last_updated: null,
      freshness_at: null,
      provenance: null,
      role: clientSnapshot.role && typeof clientSnapshot.role === "object"
        ? (clientSnapshot.role as Record<string, unknown>)
        : { id: body.role_id },
      level: clientSnapshot.level && typeof clientSnapshot.level === "object"
        ? (clientSnapshot.level as Record<string, unknown>)
        : { id: body.level_id },
      location: clientSnapshot.location && typeof clientSnapshot.location === "object"
        ? (clientSnapshot.location as Record<string, unknown>)
        : { id: body.location_id },
      form_data: clientSnapshot.form_data && typeof clientSnapshot.form_data === "object"
        ? (clientSnapshot.form_data as Record<string, unknown>)
        : {},
    };
  } else {
    const clientSnapshot = body.benchmark_snapshot ?? {};
    const snapshotPercentiles = clientSnapshot.benchmark_percentiles as
      | Record<string, number>
      | undefined;

    if (
      !snapshotPercentiles ||
      !Number.isFinite(snapshotPercentiles.p25) ||
      !Number.isFinite(snapshotPercentiles.p50) ||
      !Number.isFinite(snapshotPercentiles.p75) ||
      !Number.isFinite(snapshotPercentiles.p90)
    ) {
      return NextResponse.json(
        { error: "benchmark_snapshot must include valid percentile data (p25, p50, p75, p90)." },
        { status: 400 },
      );
    }

    const percentiles = {
      p10: Number(snapshotPercentiles.p10 ?? snapshotPercentiles.p25),
      p25: Number(snapshotPercentiles.p25),
      p50: Number(snapshotPercentiles.p50),
      p75: Number(snapshotPercentiles.p75),
      p90: Number(snapshotPercentiles.p90),
    };

    const recommendedValue = Math.round(getExpectedOfferValue(percentiles, targetPercentile));
    const recommendedLow = Math.round(recommendedValue * 0.96);
    const recommendedHigh = Math.round(recommendedValue * 1.04);

    if (offerMode === "candidate_advised") {
      advisedBaseline = body.advised_baseline ?? {
        recommended_value: recommendedValue,
        recommended_low: recommendedLow,
        recommended_high: recommendedHigh,
        recommended_percentile: targetPercentile,
      };
      offerValue = Number.isFinite(Number(body.offer_value)) ? Math.round(Number(body.offer_value)) : recommendedValue;
      offerLow = Number.isFinite(Number(body.offer_low)) ? Math.round(Number(body.offer_low)) : recommendedLow;
      offerHigh = Number.isFinite(Number(body.offer_high)) ? Math.round(Number(body.offer_high)) : recommendedHigh;
    } else {
      offerValue = Math.round(getExpectedOfferValue(percentiles, targetPercentile));
      offerLow = Math.round(offerValue * 0.96);
      offerHigh = Math.round(offerValue * 1.04);
    }

    benchmarkSnapshot = {
      benchmark_percentiles: percentiles,
      benchmark_source:
        clientSnapshot.benchmark_source === "uploaded" ? "uploaded" : "market",
      sample_size:
        typeof clientSnapshot.sample_size === "number"
          ? clientSnapshot.sample_size
          : 0,
      confidence:
        typeof clientSnapshot.confidence === "string"
          ? clientSnapshot.confidence
          : "Medium",
      last_updated:
        typeof clientSnapshot.last_updated === "string"
          ? clientSnapshot.last_updated
          : null,
      freshness_at:
        typeof clientSnapshot.freshness_at === "string"
          ? clientSnapshot.freshness_at
          : null,
      provenance:
        typeof clientSnapshot.provenance === "string"
          ? clientSnapshot.provenance
          : null,
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
  }

  const insertPayload = {
    workspace_id,
    employee_id: employeeId,
    created_by: user_id,
    recipient_name: recipientMode === "manual" ? body.recipient_name ?? null : null,
    recipient_email: recipientMode === "manual" ? body.recipient_email ?? null : null,
    role_id: body.role_id!,
    level_id: body.level_id!,
    location_id: body.location_id!,
    employment_type: body.employment_type!,
    target_percentile: targetPercentile,
    offer_value: offerValue,
    offer_low: offerLow,
    offer_high: offerHigh,
    currency: body.currency!,
    salary_breakdown: body.salary_breakdown || {},
    benchmark_snapshot: benchmarkSnapshot,
    export_format: body.export_format || "JSON",
    status: body.status || "draft",
    offer_mode: offerMode,
    internal_metadata: offerMode === "internal" ? (body.internal_metadata || {}) : {},
    advised_baseline: advisedBaseline,
  };

  const { data, error } = await queryClient
    .from("offers")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not create this offer right now.",
      logLabel: "Offer create failed",
    });
  }

  return NextResponse.json(
    {
      offer: data,
      export_payload: buildExportPayload(data as unknown as Record<string, unknown>),
    },
    { status: 201 }
  );
}
