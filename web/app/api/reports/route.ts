import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { jsonServerError, jsonValidationError } from "@/lib/errors/http";

const ALLOWED_TYPES = new Set(["overview", "benchmark", "compliance", "custom"]);
const ALLOWED_FORMATS = new Set(["PDF", "XLSX", "Slides"]);
const STARTER_TEMPLATE_SLUGS = [
  "exec-comp-health-monthly",
  "role-market-benchmark-quarterly",
  "pay-equity-and-fairness-monthly",
];
const STARTER_REPORT_FALLBACKS: Array<{
  title: string;
  type_id: "overview" | "benchmark" | "compliance";
  tags: string[];
}> = [
  {
    title: "UAE Executive Compensation Health (Monthly)",
    type_id: "overview",
    tags: ["Board", "CHRO", "CFO", "Budget", "Risk"],
  },
  {
    title: "GCC Role Market Benchmark (Quarterly)",
    type_id: "benchmark",
    tags: ["Market", "GCC", "Roles", "Percentiles"],
  },
  {
    title: "Pay Governance & Equity (Monthly)",
    type_id: "compliance",
    tags: ["Equity", "Governance", "Remediation"],
  },
];

function mapCadenceToSchedule(cadence?: string | null): "once" | "daily" | "weekly" | "monthly" | "quarterly" | null {
  if (!cadence) return null;
  const normalized = cadence.toLowerCase().trim();
  if (normalized.includes("daily")) return "daily";
  if (normalized.includes("weekly")) return "weekly";
  if (normalized.includes("monthly")) return "monthly";
  if (normalized.includes("quarterly")) return "quarterly";
  if (normalized.includes("on demand")) return "once";
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
    .from("reports")
    .select("*")
    .eq("workspace_id", workspace_id)
    .order("updated_at", { ascending: false });

  if (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not load your reports right now.",
      logLabel: "Reports load failed",
    });
  }

  const existingReports = (data || []) as Array<Record<string, unknown>>;
  if (existingReports.length > 0) {
    return NextResponse.json({ reports: existingReports });
  }

  // First-time workspace bootstrap: create starter reports from active templates.
  const { data: templates } = await supabase
    .from("report_templates")
    .select("*")
    .eq("is_active", true)
    .or(`workspace_id.eq.${workspace_id},workspace_id.is.null`)
    .order("updated_at", { ascending: false });

  const selectedTemplates =
    (templates || []).filter((template) => STARTER_TEMPLATE_SLUGS.includes(template.slug));

  const now = new Date().toISOString();
  const starterInsertRows =
    selectedTemplates.length > 0
      ? selectedTemplates.map((template) => ({
          workspace_id,
          title: template.title,
          type_id: template.type_id,
          owner: wsContext.context.user_email,
          tags: template.tags || [],
          schedule_cadence: mapCadenceToSchedule(template.cadence),
          recipients: [],
          config: {
            ...(template.config || {}),
            template_slug: template.slug,
            starter_seeded: true,
          },
          format: "PDF",
          status: "In Review",
          template_id: template.id,
          template_version: template.version ?? 1,
          build_error: null,
          last_run_at: null,
          updated_at: now,
        }))
      : STARTER_REPORT_FALLBACKS.map((fallback) => ({
          workspace_id,
          title: fallback.title,
          type_id: fallback.type_id,
          owner: wsContext.context.user_email,
          tags: fallback.tags,
          schedule_cadence: null,
          recipients: [],
          config: { starter_seeded: true, fallback_seeded: true },
          format: "PDF",
          status: "In Review",
          template_id: null,
          template_version: null,
          build_error: null,
          last_run_at: null,
          updated_at: now,
        }));

  const { data: inserted, error: insertError } = await supabase
    .from("reports")
    .insert(starterInsertRows)
    .select("*");

  if (insertError || !inserted) {
    return NextResponse.json({ reports: [] });
  }

  const { data: seededReports } = await supabase
    .from("reports")
    .select("*")
    .eq("workspace_id", workspace_id)
    .order("updated_at", { ascending: false });

  return NextResponse.json({ reports: seededReports || inserted });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }
  const { workspace_id, user_email } = wsContext.context;

  const body = await request.json();
  const { template_id, title, type_id, owner, tags, schedule_cadence, recipients, config, format } = body;

  let resolvedTitle = title;
  let resolvedTypeId = type_id;
  let resolvedOwner = owner || user_email;
  let resolvedTags = tags;
  let resolvedScheduleCadence = schedule_cadence;
  let resolvedRecipients = recipients;
  let resolvedConfig = config;
  let resolvedFormat = format || "PDF";
  let resolvedTemplateId = template_id || null;
  let templateVersion: number | null = null;

  if (template_id) {
    const { data: template, error: templateError } = await supabase
      .from("report_templates")
      .select("*")
      .eq("id", template_id)
      .eq("is_active", true)
      .or(`workspace_id.eq.${workspace_id},workspace_id.is.null`)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    } else {
      resolvedTitle = resolvedTitle || template.title;
      resolvedTypeId = resolvedTypeId || template.type_id;
      resolvedOwner = resolvedOwner || template.owner || user_email;
      resolvedTags = resolvedTags || template.tags || [];
      resolvedScheduleCadence =
        resolvedScheduleCadence !== undefined
          ? resolvedScheduleCadence
          : mapCadenceToSchedule(template.cadence);
      resolvedRecipients = resolvedRecipients || [];
      resolvedConfig = {
        ...(template.config || {}),
        ...(resolvedConfig || {}),
        template_slug: template.slug,
      };
      resolvedFormat = resolvedFormat || "PDF";
      templateVersion = template.version ?? 1;
      resolvedTemplateId = template.id;
    }
  }

  if (!resolvedTitle || !resolvedTypeId || !resolvedOwner) {
    return jsonValidationError({
      message: "Please correct the highlighted fields and try again.",
      fields: {
        ...(!resolvedTitle ? { title: "Enter a report title and try again." } : {}),
        ...(!resolvedTypeId ? { type_id: "Choose a report type and try again." } : {}),
        ...(!resolvedOwner ? { owner: "Choose an owner and try again." } : {}),
      },
    });
  }

  if (!ALLOWED_TYPES.has(resolvedTypeId)) {
    return NextResponse.json({ error: "Invalid type_id" }, { status: 400 });
  }

  if (!ALLOWED_FORMATS.has(resolvedFormat)) {
    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("reports")
    .insert({
      workspace_id,
      title: resolvedTitle,
      type_id: resolvedTypeId,
      owner: resolvedOwner,
      tags: resolvedTags || [],
      schedule_cadence: resolvedScheduleCadence || null,
      recipients: resolvedRecipients || [],
      config: resolvedConfig || {},
      format: resolvedFormat,
      status: "In Review",
      template_id: resolvedTemplateId,
      template_version: templateVersion,
      build_error: null,
    })
    .select()
    .single();

  if (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not create this report right now.",
      logLabel: "Report create failed",
    });
  }
  return NextResponse.json({ report: data }, { status: 201 });
}
