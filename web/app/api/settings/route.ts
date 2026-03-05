import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace-context";

/**
 * GET /api/settings
 * Load workspace settings for the current user's workspace (or override for super admins)
 */
export async function GET() {
  const supabase = await createClient();
  
  // Use workspace context (supports super admin override)
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { workspace_id, is_override } = wsContext.context;

  // Get workspace info
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, slug")
    .eq("id", workspace_id)
    .single();

  // Get workspace settings (may not exist yet)
  const { data: settings } = await supabase
    .from("workspace_settings")
    .select("*")
    .eq("workspace_id", workspace_id)
    .single();

  return NextResponse.json({
    workspace_id,
    workspace_name: workspace?.name || null,
    workspace_slug: workspace?.slug || null,
    is_viewing_as_admin: is_override,
    settings: settings || {
      company_name: workspace?.name || null,
      company_logo: null,
      company_website: null,
      company_description: null,
      primary_color: "#5C45FD",
      industry: null,
      company_size: null,
      funding_stage: null,
      headquarters_country: null,
      headquarters_city: null,
      target_percentile: 50,
      review_cycle: "annual",
      default_currency: "AED",
      fiscal_year_start: 1,
      default_bonus_percentage: 15,
      equity_vesting_schedule: "4-year-1-cliff",
      benefits_tier: "standard",
      comp_split_basic_pct: 60,
      comp_split_housing_pct: 25,
      comp_split_transport_pct: 10,
      comp_split_other_pct: 5,
      is_configured: false,
    },
  });
}

/**
 * PATCH /api/settings
 * Update workspace settings (partial update with upsert)
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  
  // Use workspace context (supports super admin override)
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { workspace_id, is_super_admin, is_override } = wsContext.context;

  // Check admin access - super admins can always edit, regular users need admin role
  if (!is_super_admin) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", wsContext.context.user_id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
  }

  const body = await request.json();
  
  // Allowed fields to update
  const allowedFields = [
    "company_name",
    "company_logo",
    "company_website",
    "company_description",
    "primary_color",
    "industry",
    "company_size",
    "funding_stage",
    "headquarters_country",
    "headquarters_city",
    "target_percentile",
    "review_cycle",
    "default_currency",
    "fiscal_year_start",
    "default_bonus_percentage",
    "equity_vesting_schedule",
    "benefits_tier",
    "comp_split_basic_pct",
    "comp_split_housing_pct",
    "comp_split_transport_pct",
    "comp_split_other_pct",
    "is_configured",
  ];

  // Filter to only allowed fields
  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Add updated_at timestamp
  updates.updated_at = new Date().toISOString();

  // Check if settings exist
  const { data: existingSettings } = await supabase
    .from("workspace_settings")
    .select("id")
    .eq("workspace_id", workspace_id)
    .single();

  let result;
  if (existingSettings) {
    // Update existing
    result = await supabase
      .from("workspace_settings")
      .update(updates)
      .eq("workspace_id", workspace_id)
      .select()
      .single();
  } else {
    // Insert new
    result = await supabase
      .from("workspace_settings")
      .insert({
        workspace_id,
        ...updates,
      })
      .select()
      .single();
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    settings: result.data,
    is_viewing_as_admin: is_override,
  });
}
