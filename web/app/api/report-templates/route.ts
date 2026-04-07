import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { DEFAULT_REPORT_TEMPLATE_SEEDS } from "@/lib/reports/default-template-seeds";
import { jsonServerError } from "@/lib/errors/http";

const ALLOWED_TYPES = new Set(["overview", "benchmark", "compliance", "custom"]);

async function fetchTemplatesForWorkspace(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string
) {
  return supabase
    .from("report_templates")
    .select("*")
    .eq("is_active", true)
    .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
    .order("updated_at", { ascending: false });
}

async function insertMissingTemplates(
  client: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string | null
): Promise<boolean> {
  let existingQuery = client
    .from("report_templates")
    .select("slug, version")
    .eq("is_active", true);
  existingQuery =
    workspaceId === null
      ? existingQuery.is("workspace_id", null)
      : existingQuery.eq("workspace_id", workspaceId);

  const { data: existingTemplates, error: existingError } = await existingQuery;
  if (existingError) return false;

  const existingKeys = new Set(
    (existingTemplates || []).map((template) => `${template.slug}::${template.version}`)
  );

  const missing = DEFAULT_REPORT_TEMPLATE_SEEDS.filter(
    (template) => !existingKeys.has(`${template.slug}::${template.version}`)
  );
  if (missing.length === 0) return true;

  const payload = missing.map((template) => ({
    workspace_id: workspaceId,
    ...template,
  }));
  const { error: insertError } = await client.from("report_templates").insert(payload);
  return !insertError;
}

async function bootstrapDefaultTemplates(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string
) {
  const { data: available, error: availabilityError } = await fetchTemplatesForWorkspace(
    supabase,
    workspaceId
  );
  if (availabilityError || (available?.length || 0) > 0) return;

  try {
    const serviceClient = createServiceClient();
    const seededGlobal = await insertMissingTemplates(
      serviceClient as unknown as Awaited<ReturnType<typeof createClient>>,
      null
    );
    if (seededGlobal) return;
  } catch {
    // If service role key is unavailable, fall back to workspace-local seeding.
  }

  await insertMissingTemplates(supabase, workspaceId);
}

export async function GET() {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }
  const { workspace_id } = wsContext.context;

  await bootstrapDefaultTemplates(supabase, workspace_id);
  const { data, error } = await fetchTemplatesForWorkspace(supabase, workspace_id);

  if (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not load your report templates right now.",
      logLabel: "Report templates load failed",
    });
  }

  return NextResponse.json({ templates: data || [], source: "database" });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }
  const { workspace_id } = wsContext.context;
  const body = await request.json();

  const {
    slug,
    title,
    type_id,
    category,
    description,
    cadence,
    coverage,
    confidence,
    owner,
    tags,
    config,
    is_active,
    version,
  } = body;

  if (!slug || !title || !type_id) {
    return NextResponse.json({ error: "slug, title, and type_id are required" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(type_id)) {
    return NextResponse.json({ error: "Invalid type_id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("report_templates")
    .insert({
      workspace_id,
      slug,
      title,
      type_id,
      category: category || "all",
      description: description || "",
      cadence: cadence || "On Demand",
      coverage: coverage || "All roles",
      confidence: confidence || "Medium",
      owner: owner || "People Analytics",
      tags: tags || [],
      config: config || {},
      is_active: is_active ?? true,
      version: version || 1,
    })
    .select()
    .single();

  if (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not create this report template right now.",
      logLabel: "Report template create failed",
    });
  }

  return NextResponse.json({ template: data }, { status: 201 });
}
