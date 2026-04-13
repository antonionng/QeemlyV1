import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { renderOfferPdf, type OfferPdfData } from "@/lib/offers/pdf-renderer";
import type { AdvisedBaseline, InternalOfferMetadata, OfferMode } from "@/lib/offers/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json(
      { error: wsContext.error },
      { status: wsContext.status },
    );
  }

  const { workspace_id, is_override } = wsContext.context;
  const queryClient = is_override ? createServiceClient() : supabase;
  const { id } = await params;

  const { data: offer, error: offerError } = await queryClient
    .from("offers")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspace_id)
    .single();

  if (offerError || !offer) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }

  let settings: Record<string, unknown> = {};
  try {
    const serviceClient = createServiceClient();
    const { data: wsSettings } = await serviceClient
      .from("workspace_settings")
      .select(
        "company_name, company_logo, primary_color",
      )
      .eq("workspace_id", workspace_id)
      .maybeSingle();
    if (wsSettings) {
      settings = wsSettings as Record<string, unknown>;
    }
  } catch {
    // Fall back to workspace name if settings are unavailable
  }

  if (!settings.company_name) {
    try {
      const serviceClient = createServiceClient();
      const { data: workspace } = await serviceClient
        .from("workspaces")
        .select("name")
        .eq("id", workspace_id)
        .single();
      if (workspace) {
        settings.company_name = workspace.name;
      }
    } catch {
      settings.company_name = "Your Company";
    }
  }

  const snapshot = (offer.benchmark_snapshot ?? {}) as Record<string, unknown>;
  const breakdown = (offer.salary_breakdown ?? {}) as Record<
    string,
    { percent: number; amount: number }
  >;
  const role = (snapshot.role ?? {}) as Record<string, unknown>;
  const level = (snapshot.level ?? {}) as Record<string, unknown>;
  const location = (snapshot.location ?? {}) as Record<string, unknown>;

  const offerMode = (offer.offer_mode as OfferMode | null | undefined) ?? "candidate_manual";
  const isInternal = offerMode === "internal";

  let recipientName = (offer.recipient_name as string) || "";
  if (!recipientName && offer.employee_id) {
    const { data: employee } = await queryClient
      .from("employees")
      .select("first_name, last_name")
      .eq("id", offer.employee_id)
      .eq("workspace_id", workspace_id)
      .single();
    if (employee) {
      recipientName =
        `${employee.first_name || ""} ${employee.last_name || ""}`.trim();
    }
  }

  const pdfData: OfferPdfData = {
    companyName: (settings.company_name as string) || "Your Company",
    companyLogo: (settings.company_logo as string) || null,
    primaryColor: (settings.primary_color as string) || "#5C45FD",
    recipientName: recipientName || (isInternal ? "Internal" : "Candidate"),
    recipientEmail: (offer.recipient_email as string) || null,
    roleTitle: (role.title as string) || offer.role_id,
    levelName: (level.name as string) || offer.level_id,
    locationCity: (location.city as string) || (location.label as string) || "",
    locationCountry: (location.country as string) || "",
    employmentType: offer.employment_type || "national",
    targetPercentile: offer.target_percentile,
    offerValue: offer.offer_value,
    offerLow: offer.offer_low,
    offerHigh: offer.offer_high,
    currency: offer.currency,
    salaryBreakdown: breakdown,
    benchmarkSource: (snapshot.benchmark_source as string) || "market",
    confidence: (snapshot.confidence as string) || "Medium",
    createdAt: offer.created_at,
    offerMode,
    internalMetadata: isInternal
      ? ((offer.internal_metadata ?? {}) as InternalOfferMetadata)
      : undefined,
    advisedBaseline: offerMode === "candidate_advised"
      ? ((offer.advised_baseline ?? null) as AdvisedBaseline | null)
      : undefined,
  };

  try {
    const pdfBuffer = await renderOfferPdf(pdfData);
    const pdfBytes = new Uint8Array(pdfBuffer);

    let filename: string;
    if (isInternal) {
      const safeRole = (role.title as string || "brief").replace(/[^a-zA-Z0-9-_ ]/g, "").trim();
      filename = `Qeemly_Internal_Brief_${safeRole}_${id.substring(0, 8)}.pdf`;
    } else {
      const safeName = recipientName.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "offer";
      filename = `Qeemly_Offer_${safeName}_${id.substring(0, 8)}.pdf`;
    }

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err) {
    console.error("PDF generation failed", err);
    return NextResponse.json(
      { error: "PDF generation failed. Please try again." },
      { status: 500 },
    );
  }
}
