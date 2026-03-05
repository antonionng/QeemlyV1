import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { refreshComplianceSnapshot } from "@/lib/compliance/snapshot-service";
import {
  DOMAIN_CONFIG,
  DEFAULT_RISK_WEIGHTS,
  RISK_WEIGHT_KEYS,
  SOURCE_VALUES,
  isComplianceDomain,
  type ComplianceDomain,
  type SourceValue,
} from "@/lib/compliance/settings-schema";
import { NextResponse } from "next/server";

export { DOMAIN_CONFIG, SOURCE_VALUES, isComplianceDomain };

export async function getWorkspaceContextOrError() {
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return { error: NextResponse.json({ error: wsContext.error }, { status: wsContext.status }) };
  }
  return { context: wsContext.context };
}

export async function requireAdminForWorkspace(userId: string, isSuperAdmin: boolean) {
  if (isSuperAdmin) return null;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  return null;
}

export function sanitizeDomainPayload(
  domain: ComplianceDomain,
  body: Record<string, unknown>,
  mode: "create" | "update"
) {
  const cfg = DOMAIN_CONFIG[domain];
  const fieldByKey = new Map(cfg.fields.map((field) => [field.key, field]));
  const updates: Record<string, unknown> = {};
  for (const key of cfg.allowedFields) {
    if (!(key in body)) continue;
    const value = body[key];
    const field = fieldByKey.get(key);
    if (!field) {
      updates[key] = value;
      continue;
    }
    if (field.type === "number") {
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return { error: `${key} must be a non-negative number` };
      }
      updates[key] = parsed;
      continue;
    }
    if (field.type === "date" || field.type === "datetime") {
      if (value === null || value === "") {
        updates[key] = null;
        continue;
      }
      const parsed = new Date(String(value));
      if (!Number.isFinite(parsed.getTime())) {
        return { error: `${key} must be a valid ${field.type}` };
      }
      updates[key] = field.type === "date" ? parsed.toISOString().slice(0, 10) : parsed.toISOString();
      continue;
    }
    if (field.type === "select" && field.options?.length) {
      const optionValue = String(value);
      if (!field.options.includes(optionValue)) {
        return { error: `${key} must be one of: ${field.options.join(", ")}` };
      }
      updates[key] = optionValue;
      continue;
    }
    if (field.type === "text" || field.type === "textarea") {
      const text = String(value ?? "").trim();
      updates[key] = text;
      continue;
    }
    updates[key] = value;
  }
  if (!("data_source" in updates)) {
    updates.data_source = "manual";
  }
  if (!("source_updated_at" in updates)) {
    updates.source_updated_at = new Date().toISOString();
  }

  const source = updates.data_source;
  if (source && !SOURCE_VALUES.includes(source as SourceValue)) {
    return { error: `Invalid data_source. Must be one of: ${SOURCE_VALUES.join(", ")}` };
  }

  if (mode === "create") {
    for (const required of cfg.createRequired) {
      const value = updates[required];
      if (value === undefined || value === null || value === "") {
        return { error: `${required} is required` };
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return { error: "No valid fields to update" };
  }
  return { updates };
}

export function sanitizeComplianceSettingsPayload(body: Record<string, unknown>) {
  const updates: Record<string, unknown> = {};
  if ("prefer_integration_data" in body) {
    updates.prefer_integration_data = Boolean(body.prefer_integration_data);
  }
  if ("prefer_import_data" in body) {
    updates.prefer_import_data = Boolean(body.prefer_import_data);
  }
  if ("allow_manual_overrides" in body) {
    updates.allow_manual_overrides = Boolean(body.allow_manual_overrides);
  }
  if ("is_compliance_configured" in body) {
    updates.is_compliance_configured = Boolean(body.is_compliance_configured);
  }
  if ("default_jurisdictions" in body) {
    if (!Array.isArray(body.default_jurisdictions)) {
      return { error: "default_jurisdictions must be an array of strings" };
    }
    const values = body.default_jurisdictions
      .map((value) => String(value || "").trim())
      .filter(Boolean);
    if (values.length === 0) {
      return { error: "default_jurisdictions cannot be empty" };
    }
    updates.default_jurisdictions = values;
  }

  const numericFields = [
    "visa_lead_time_days",
    "deadline_sla_days",
    "document_renewal_threshold_days",
  ] as const;
  for (const field of numericFields) {
    if (!(field in body)) continue;
    const parsed = Number(body[field]);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { error: `${field} must be a non-negative number` };
    }
    updates[field] = Math.round(parsed);
  }

  if ("risk_weights" in body) {
    const value = body.risk_weights;
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { error: "risk_weights must be an object" };
    }
    const weights = value as Record<string, unknown>;
    const merged = { ...DEFAULT_RISK_WEIGHTS };
    for (const key of RISK_WEIGHT_KEYS) {
      if (!(key in weights)) continue;
      const parsed = Number(weights[key]);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return { error: `risk_weights.${key} must be a non-negative number` };
      }
      merged[key] = parsed;
    }
    const total = Object.values(merged).reduce((sum, weight) => sum + weight, 0);
    if (total <= 0) {
      return { error: "risk_weights total must be greater than 0" };
    }
    updates.risk_weights = merged;
  }

  if (Object.keys(updates).length === 0) {
    return { error: "No valid fields to update" };
  }
  return { updates };
}

export async function safeRefreshComplianceSnapshot(workspaceId: string) {
  try {
    await refreshComplianceSnapshot(workspaceId);
    return { ok: true as const };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Compliance snapshot refresh failed";
    return { ok: false as const, error: message };
  }
}
