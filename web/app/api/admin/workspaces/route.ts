import { NextResponse } from "next/server";
import { adminRouteErrorResponse, throwIfAdminQueryError } from "@/lib/admin/api-client";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSuperAdmin } from "@/lib/admin/auth";

type WorkspaceWithStats = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  employee_count: number;
  avg_base_salary: number | null;
  department_count: number;
  upload_count: number;
  last_upload_at: string | null;
};

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const supabase = createServiceClient();

    const { data: workspaces, error: workspacesError } = await supabase
      .from("workspaces")
      .select("id, name, slug, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    throwIfAdminQueryError(workspacesError, "Failed to load workspaces");

    if (!workspaces || workspaces.length === 0) {
      return NextResponse.json([]);
    }

    const workspaceIds = workspaces.map((w) => w.id);
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("workspace_id, base_salary, department")
      .in("workspace_id", workspaceIds);
    throwIfAdminQueryError(employeesError, "Failed to load workspace employees");

    const { data: uploads, error: uploadsError } = await supabase
      .from("data_uploads")
      .select("workspace_id, created_at")
      .in("workspace_id", workspaceIds)
      .order("created_at", { ascending: false });
    throwIfAdminQueryError(uploadsError, "Failed to load workspace uploads");

    const statsMap = new Map<string, {
      employee_count: number;
      total_salary: number;
      departments: Set<string>;
      upload_count: number;
      last_upload_at: string | null;
    }>();

    for (const w of workspaces) {
      statsMap.set(w.id, {
        employee_count: 0,
        total_salary: 0,
        departments: new Set(),
        upload_count: 0,
        last_upload_at: null,
      });
    }

    for (const emp of employees ?? []) {
      const stats = statsMap.get(emp.workspace_id);
      if (stats) {
        stats.employee_count++;
        stats.total_salary += Number(emp.base_salary) || 0;
        if (emp.department) {
          stats.departments.add(emp.department);
        }
      }
    }

    for (const upload of uploads ?? []) {
      const stats = statsMap.get(upload.workspace_id);
      if (stats) {
        stats.upload_count++;
        if (!stats.last_upload_at) {
          stats.last_upload_at = upload.created_at;
        }
      }
    }

    const enriched: WorkspaceWithStats[] = workspaces.map((w) => {
      const stats = statsMap.get(w.id)!;
      return {
        ...w,
        employee_count: stats.employee_count,
        avg_base_salary: stats.employee_count > 0
          ? Math.round(stats.total_salary / stats.employee_count)
          : null,
        department_count: stats.departments.size,
        upload_count: stats.upload_count,
        last_upload_at: stats.last_upload_at,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    return adminRouteErrorResponse(error);
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const name = String(body?.name || "").trim();
    const requestedSlug = String(body?.slug || "").trim();

    if (!name) {
      return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
    }

    const baseSlug = slugify(requestedSlug || name);
    if (!baseSlug) {
      return NextResponse.json({ error: "Invalid workspace name/slug" }, { status: 400 });
    }

    const supabase = createServiceClient();
    let finalSlug = baseSlug;

    for (let i = 0; i < 50; i++) {
      const candidate = i === 0 ? baseSlug : `${baseSlug}-${i + 1}`;
      const { data: existing, error: existingError } = await supabase
        .from("workspaces")
        .select("id")
        .eq("slug", candidate)
        .maybeSingle();
      throwIfAdminQueryError(existingError, "Failed to validate workspace slug");
      if (!existing) {
        finalSlug = candidate;
        break;
      }
    }

    const { data, error } = await supabase
      .from("workspaces")
      .insert({ name, slug: finalSlug })
      .select("id, name, slug, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    return adminRouteErrorResponse(err);
  }
}
