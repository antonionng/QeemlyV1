import { NextRequest, NextResponse } from "next/server";
import { adminRouteErrorResponse } from "@/lib/admin/api-client";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";

type RoleMappingReviewActionBody = {
  reviewId?: string;
  action?: "approve" | "reject";
  canonicalRoleId?: string;
  aliasText?: string;
  workspaceId?: string;
  subjectType?: string;
  subjectId?: string;
};

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const workspaceId = url.searchParams.get("workspaceId");
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("role_mapping_reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const reviews = (data || []).filter((review) => {
      if (status && review.status !== status) return false;
      if (workspaceId && review.workspace_id !== workspaceId) return false;
      return true;
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    return adminRouteErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const body = (await request.json().catch(() => null)) as RoleMappingReviewActionBody | null;
    if (!body?.reviewId || !body?.action) {
      return NextResponse.json({ error: "reviewId and action are required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    if (body.action === "approve") {
      if (!body.canonicalRoleId || !body.aliasText || !body.workspaceId) {
        return NextResponse.json(
          { error: "canonicalRoleId, aliasText, and workspaceId are required for approvals" },
          { status: 400 },
        );
      }

      const normalizedAlias = body.aliasText.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      const { error: aliasError } = await supabase.from("canonical_role_aliases").insert({
        canonical_role_id: body.canonicalRoleId,
        alias_text: body.aliasText,
        alias_normalized: normalizedAlias,
        workspace_id: body.workspaceId,
        source_kind: "reviewed_override",
        confidence_default: "high",
        is_active: true,
      });
      if (aliasError) {
        return NextResponse.json({ error: aliasError.message }, { status: 500 });
      }

      if (body.subjectType === "employee" && body.subjectId) {
        const { error: employeeError } = await supabase
          .from("employees")
          .update({
            role_id: body.canonicalRoleId,
            canonical_role_id: body.canonicalRoleId,
            role_mapping_confidence: "high",
            role_mapping_source: "review",
            role_mapping_status: "mapped",
            updated_at: new Date().toISOString(),
          })
          .eq("id", body.subjectId);
        if (employeeError) {
          return NextResponse.json({ error: employeeError.message }, { status: 500 });
        }
      }
    }

    const { error: reviewError } = await supabase
      .from("role_mapping_reviews")
      .update({
        proposed_canonical_role_id: body.canonicalRoleId ?? null,
        status: body.action === "approve" ? "approved" : "rejected",
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.reviewId);

    if (reviewError) {
      return NextResponse.json({ error: reviewError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminRouteErrorResponse(error);
  }
}
