import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace-context";

const MISSING_COLUMN_ERROR =
  /Could not find the '([^']+)' column of 'workspace_settings' in the schema cache/i;

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

  const hasOnboardingStarted = !!settings?.onboarding_started_at;
  const onboardingComplete = !!settings?.onboarding_completed_at;

  return NextResponse.json({
    workspace_id,
    workspace_name: workspace?.name || null,
    workspace_slug: workspace?.slug || null,
    is_viewing_as_admin: is_override,
    onboarding_started: hasOnboardingStarted,
    onboarding_complete: onboardingComplete,
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

  // Check if settings exist
  const { data: existingSettings } = await supabase
    .from("workspace_settings")
    .select("id")
    .eq("workspace_id", workspace_id)
    .single();

  const supportedUpdates: Record<string, unknown> = { ...updates };
  const droppedColumns: string[] = [];
  let result: { data: Record<string, unknown> | null; error: { message: string } | null } = {
    data: null,
    error: { message: "Unknown settings save error" },
  };

  // Retry writes after removing any missing-column payload keys.
  while (Object.keys(supportedUpdates).length > 0) {
    const writePayload = {
      ...supportedUpdates,
      updated_at: new Date().toISOString(),
    };

    if (existingSettings) {
      const writeResult = await supabase
        .from("workspace_settings")
        .update(writePayload)
        .eq("workspace_id", workspace_id)
        .select()
        .single();
      result = {
        data: (writeResult.data as Record<string, unknown> | null) ?? null,
        error: writeResult.error ? { message: writeResult.error.message } : null,
      };
    } else {
      const writeResult = await supabase
        .from("workspace_settings")
        .insert({
          workspace_id,
          ...writePayload,
        })
        .select()
        .single();
      result = {
        data: (writeResult.data as Record<string, unknown> | null) ?? null,
        error: writeResult.error ? { message: writeResult.error.message } : null,
      };
    }

    if (!result.error) {
      break;
    }

    const missingColumn = result.error.message.match(MISSING_COLUMN_ERROR)?.[1];
    if (!missingColumn || !(missingColumn in supportedUpdates)) {
      break;
    }

    delete supportedUpdates[missingColumn];
    droppedColumns.push(missingColumn);
  }

  if (result.error) {
    return NextResponse.json(
      {
        error: result.error.message,
        hint: "Run the latest database migrations to align workspace_settings schema.",
      },
      { status: 500 },
    );
  }

  if (!result.data) {
    const dropped = droppedColumns.length > 0 ? ` (${droppedColumns.join(", ")})` : "";
    return NextResponse.json(
      {
        error: `No supported settings fields were available to save${dropped}.`,
        hint: "Run the latest database migrations to align workspace_settings schema.",
      },
      { status: 409 },
    );
  }

  return NextResponse.json({ 
    success: true, 
    settings: result.data,
    is_viewing_as_admin: is_override,
    dropped_unsupported_fields: droppedColumns,
  });
}
