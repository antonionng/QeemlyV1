import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { jsonServerError } from "@/lib/errors/http";

type OfferStatus = "draft" | "ready" | "sent" | "archived";
type OfferFormat = "PDF" | "DOCX" | "JSON";

type OfferUpdateBody = {
  employee_id?: string | null;
  recipient_name?: string | null;
  recipient_email?: string | null;
  status?: OfferStatus;
  export_format?: OfferFormat;
  salary_breakdown?: Record<string, unknown>;
  benchmark_snapshot?: Record<string, unknown>;
  target_percentile?: number;
  offer_value?: number;
  offer_low?: number;
  offer_high?: number;
  internal_metadata?: Record<string, unknown>;
  advised_baseline?: Record<string, unknown> | null;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { workspace_id, is_override } = wsContext.context;
  const queryClient = is_override ? createServiceClient() : supabase;
  const { id } = await params;

  const { data, error } = await queryClient
    .from("offers")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspace_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }

  return NextResponse.json({ offer: data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { workspace_id, is_override } = wsContext.context;
  const queryClient = is_override ? createServiceClient() : supabase;
  const { id } = await params;
  const body = (await request.json()) as OfferUpdateBody;

  const { data: existing } = await queryClient
    .from("offers")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspace_id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }

  const allowedFields: Array<keyof OfferUpdateBody> = [
    "employee_id",
    "recipient_name",
    "recipient_email",
    "status",
    "export_format",
    "salary_breakdown",
    "benchmark_snapshot",
    "target_percentile",
    "offer_value",
    "offer_low",
    "offer_high",
    "internal_metadata",
    "advised_baseline",
  ];
  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key] ?? null;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const isInternalMode = existing.offer_mode === "internal";

  if (!isInternalMode) {
    const merged = {
      employee_id: (updates.employee_id as string | null | undefined) ?? existing.employee_id,
      recipient_name:
        (updates.recipient_name as string | null | undefined) ?? existing.recipient_name,
      recipient_email:
        (updates.recipient_email as string | null | undefined) ?? existing.recipient_email,
    };

    const hasEmployee = Boolean(merged.employee_id);
    const hasManual = Boolean(merged.recipient_name && merged.recipient_email);
    if ((hasEmployee && hasManual) || (!hasEmployee && !hasManual)) {
      return NextResponse.json(
        { error: "Offer must use exactly one recipient mode: employee or manual." },
        { status: 400 }
      );
    }

    if (hasManual && !isValidEmail(String(merged.recipient_email))) {
      return NextResponse.json({ error: "recipient_email is invalid." }, { status: 400 });
    }

    if (hasEmployee && merged.employee_id) {
      const { data: employee } = await queryClient
        .from("employees")
        .select("id")
        .eq("id", merged.employee_id)
        .eq("workspace_id", workspace_id)
        .single();
      if (!employee) {
        return NextResponse.json({ error: "Employee not found in workspace." }, { status: 400 });
      }

      updates.recipient_name = null;
      updates.recipient_email = null;
    }
  }

  if (updates.export_format && !["JSON", "PDF"].includes(updates.export_format as string)) {
    return NextResponse.json(
      { error: "Supported export formats are JSON and PDF." },
      { status: 400 },
    );
  }

  if (updates.target_percentile !== undefined) {
    const pct = Number(updates.target_percentile);
    if (!Number.isFinite(pct) || pct < 25 || pct > 90) {
      return NextResponse.json({ error: "target_percentile must be between 25 and 90." }, { status: 400 });
    }
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await queryClient
    .from("offers")
    .update(updates)
    .eq("id", id)
    .eq("workspace_id", workspace_id)
    .select("*")
    .single();

  if (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not update this offer right now.",
      logLabel: "Offer update failed",
    });
  }

  return NextResponse.json({ offer: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { workspace_id, is_override } = wsContext.context;
  const queryClient = is_override ? createServiceClient() : supabase;
  const { id } = await params;

  const { error } = await queryClient
    .from("offers")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspace_id);

  if (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not delete this offer right now.",
      logLabel: "Offer delete failed",
    });
  }

  return NextResponse.json({ success: true });
}
