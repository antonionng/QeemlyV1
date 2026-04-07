import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { jsonServerError, jsonValidationError } from "@/lib/errors/http";

type SyncPayload = {
  integration_id?: string;
  event_key?: string;
  event_type?: string;
  cursor?: string;
  employee?: Record<string, unknown>;
  compensation?: Record<string, unknown>;
  contributions?: Record<string, unknown>[];
  equity_grants?: Record<string, unknown>[];
  visa_records?: Record<string, unknown>[];
};

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  const secret = process.env.INTEGRATIONS_SYNC_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization") || "";
    if (authHeader !== `Bearer ${secret}`) {
      return unauthorized();
    }
  }

  const body = (await request.json()) as SyncPayload;
  if (!body.integration_id || !body.event_key || !body.event_type) {
    return jsonValidationError({
      message: "Please correct the request and try again.",
      fields: {
        ...(body.integration_id ? {} : { integration_id: "Provide an integration id." }),
        ...(body.event_key ? {} : { event_key: "Provide an event key." }),
        ...(body.event_type ? {} : { event_type: "Provide an event type." }),
      },
    });
  }

  const supabase = createServiceClient();
  const { data: integration } = await supabase
    .from("integrations")
    .select("id, workspace_id, provider,category")
    .eq("id", body.integration_id)
    .single();
  if (!integration) {
    return NextResponse.json({ error: "Integration not found" }, { status: 404 });
  }

  const workspaceId = integration.workspace_id as string;
  const { data: inbound, error: inboundError } = await supabase
    .from("integration_inbound_events")
    .insert({
      integration_id: integration.id,
      workspace_id: workspaceId,
      event_key: body.event_key,
      event_type: body.event_type,
      payload: body,
      status: "received",
    })
    .select("id")
    .single();

  if (inboundError && inboundError.code === "23505") {
    return NextResponse.json({ ok: true, deduped: true });
  }
  if (inboundError || !inbound?.id) {
    return jsonServerError(inboundError ?? new Error("Failed to save inbound event"), {
      defaultMessage: "We could not process this sync event right now.",
      logLabel: "Integration profile sync inbound save failed",
    });
  }

  try {
    const employee = body.employee || {};
    const email = String(employee.email || "").trim().toLowerCase();
    const firstName = String(employee.first_name || employee.firstName || "Unknown");
    const lastName = String(employee.last_name || employee.lastName || "Employee");
    let employeeId = String(employee.id || "");

    if (!employeeId && email) {
      const { data: existingByEmail } = await supabase
        .from("employees")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("email", email)
        .maybeSingle();
      if (existingByEmail?.id) {
        employeeId = existingByEmail.id as string;
      }
    }

    if (!employeeId) {
      const { data: createdEmployee, error: createError } = await supabase
        .from("employees")
        .insert({
          workspace_id: workspaceId,
          first_name: firstName,
          last_name: lastName,
          email: email || null,
          department: String(employee.department || "Engineering"),
          role_id: String(employee.role_id || employee.roleId || "swe"),
          level_id: String(employee.level_id || employee.levelId || "ic3"),
          location_id: String(employee.location_id || employee.locationId || "dubai"),
          base_salary: Number(body.compensation?.base_salary || 0),
          bonus: Number(body.compensation?.bonus || 0),
          equity: Number(body.compensation?.equity || 0),
          currency: String(body.compensation?.currency || "AED"),
          status: "active",
          employment_type: String(employee.employment_type || "national"),
          hire_date: employee.hire_date ? String(employee.hire_date) : null,
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (createError || !createdEmployee?.id) throw new Error(createError?.message || "Failed to create employee");
      employeeId = createdEmployee.id as string;
    }

    const avatarUrl = firstString(
      employee.avatar_url,
      employee.avatarUrl,
      employee.photo_url,
      employee.photoUrl,
      employee.profile_photo_url,
      employee.profilePhotoUrl,
      employee.image_url,
      employee.imageUrl,
      employee.picture,
      employee.avatar
    );

    const { error: enrichmentError } = await supabase.from("employee_profile_enrichment").upsert(
      {
        workspace_id: workspaceId,
        employee_id: employeeId,
        avatar_url: avatarUrl,
        avatar_source: integration.category === "ats" ? "ats" : "hris",
        external_hris_id: employee.external_hris_id || employee.external_id || null,
        external_ats_id: employee.external_ats_id || null,
        legal_name: employee.legal_name || null,
        preferred_name: employee.preferred_name || null,
        manager_name: employee.manager_name || null,
        source_system: integration.provider || "hris",
        source_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "employee_id" }
    );
    if (enrichmentError) throw new Error(enrichmentError.message);

    if (body.compensation) {
      const baseSalary = Number(body.compensation.base_salary || 0);
      const bonus = Number(body.compensation.bonus || 0);
      const equity = Number(body.compensation.equity || 0);
      const currency = String(body.compensation.currency || "AED");
      const effectiveDate = String(body.compensation.effective_date || new Date().toISOString().slice(0, 10));

      const { error: updateCompError } = await supabase
        .from("employees")
        .update({
          base_salary: baseSalary,
          bonus,
          equity,
          currency,
          updated_at: new Date().toISOString(),
        })
        .eq("id", employeeId)
        .eq("workspace_id", workspaceId);
      if (updateCompError) throw new Error(updateCompError.message);

      const { error: historyError } = await supabase.from("compensation_history").insert({
        employee_id: employeeId,
        effective_date: effectiveDate,
        base_salary: baseSalary,
        bonus,
        equity,
        currency,
        change_reason: "market-adjustment",
      });
      if (historyError) throw new Error(historyError.message);
    }

    if (Array.isArray(body.contributions)) {
      await supabase
        .from("employee_contribution_snapshots")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("employee_id", employeeId);
      if (body.contributions.length > 0) {
        const payload = body.contributions.map((entry) => ({
          ...entry,
          workspace_id: workspaceId,
          employee_id: employeeId,
        }));
        const { error } = await supabase.from("employee_contribution_snapshots").insert(payload);
        if (error) throw new Error(error.message);
      }
    }

    if (Array.isArray(body.equity_grants)) {
      await supabase.from("equity_grants").delete().eq("workspace_id", workspaceId).eq("employee_id", employeeId);
      if (body.equity_grants.length > 0) {
        const payload = body.equity_grants.map((entry) => ({
          ...entry,
          workspace_id: workspaceId,
          employee_id: employeeId,
          source_system: integration.provider || "hris",
          updated_at: new Date().toISOString(),
        }));
        const { error } = await supabase.from("equity_grants").insert(payload);
        if (error) throw new Error(error.message);
      }
    }

    if (Array.isArray(body.visa_records)) {
      await supabase
        .from("employee_visa_records")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("employee_id", employeeId);
      if (body.visa_records.length > 0) {
        const payload = body.visa_records.map((entry) => ({
          ...entry,
          workspace_id: workspaceId,
          employee_id: employeeId,
          source_system: integration.provider || "hris",
          source_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        const { error } = await supabase.from("employee_visa_records").insert(payload);
        if (error) throw new Error(error.message);
      }
    }

    await supabase.from("employee_timeline_events").insert({
      workspace_id: workspaceId,
      employee_id: employeeId,
      event_type: "sync_received",
      actor_type: "hris",
      actor_name: String(integration.provider || "integration"),
      source_system: "integration_sync",
      payload: {
        event_key: body.event_key,
        event_type: body.event_type,
      },
    });

    await supabase.from("integration_sync_state").upsert(
      {
        integration_id: integration.id,
        workspace_id: workspaceId,
        last_cursor: body.cursor || null,
        last_event_at: new Date().toISOString(),
        last_success_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "integration_id" }
    );

    await supabase
      .from("integration_inbound_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("id", inbound.id);

    return NextResponse.json({ ok: true, employee_id: employeeId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    await supabase
      .from("integration_inbound_events")
      .update({ status: "failed", processed_at: new Date().toISOString(), error_message: message })
      .eq("id", inbound.id);
    return jsonServerError(error, {
      defaultMessage: "We could not process this sync event right now.",
      logLabel: "Integration profile sync processing failed",
    });
  }
}
