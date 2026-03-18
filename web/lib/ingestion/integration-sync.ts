/**
 * Integration sync worker - same patterns as market ingestion:
 * fetch from provider -> normalize -> DQ -> upsert to employees/compensation_history.
 *
 * Provider API calls (Merge.dev, ZenHR, Bayzat) are stubbed - wire when ready.
 */

import { createServiceClient } from "@/lib/supabase/service";
import { transformEmployee } from "@/lib/upload/transformers";

export type IntegrationSyncResult = {
  status: "success" | "partial" | "failed";
  records_created: number;
  records_updated: number;
  records_failed: number;
  error_message?: string;
};

export async function runIntegrationSync(integrationId: string): Promise<IntegrationSyncResult> {
  const supabase = createServiceClient();

  const { data: integration } = await supabase
    .from("integrations")
    .select("workspace_id, provider")
    .eq("id", integrationId)
    .single();

  if (!integration?.workspace_id) {
    return { status: "failed", records_created: 0, records_updated: 0, records_failed: 0, error_message: "Integration not found" };
  }

  const rawRows = await fetchFromProvider(integration.provider, integrationId);
  if (rawRows.length === 0) {
    return { status: "success", records_created: 0, records_updated: 0, records_failed: 0 };
  }

  let succeeded = 0;
  let failed = 0;

  for (const row of rawRows as Record<string, unknown>[]) {
    const mapped = mapProviderRowToOurSchema(row, integration.provider);
    const transformed = transformEmployee(mapped);
    if (!transformed) {
      failed++;
      continue;
    }
    const payload = {
      workspace_id: integration.workspace_id,
      first_name: transformed.firstName,
      last_name: transformed.lastName,
      email: transformed.email,
      department: transformed.department,
      role_id: transformed.roleId,
      canonical_role_id: transformed.canonicalRoleId,
      original_role_text: transformed.originalRoleText,
      original_level_text: transformed.originalLevelText,
      role_mapping_confidence: transformed.roleMappingConfidence,
      role_mapping_source: transformed.roleMappingSource,
      role_mapping_status: transformed.roleMappingStatus,
      level_id: transformed.levelId,
      location_id: transformed.locationId,
      base_salary: transformed.baseSalary,
      bonus: transformed.bonus,
      equity: transformed.equity,
      currency: transformed.currency,
      status: transformed.status,
      employment_type: transformed.employmentType,
      hire_date: transformed.hireDate,
      performance_rating: transformed.performanceRating,
      updated_at: new Date().toISOString(),
    };
    if (transformed.email) {
      const { data: existing } = await supabase
        .from("employees")
        .select("id")
        .eq("workspace_id", integration.workspace_id)
        .eq("email", transformed.email)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase.from("employees").update(payload).eq("id", existing.id);
        if (error) failed++;
        else succeeded++;
      } else {
        const { error } = await supabase.from("employees").insert(payload);
        if (error) failed++;
        else succeeded++;
      }
    } else {
      const { error } = await supabase.from("employees").insert(payload);
      if (error) failed++;
      else succeeded++;
    }
  }

  return {
    status: failed === rawRows.length ? "failed" : failed > 0 ? "partial" : "success",
    records_created: succeeded,
    records_updated: 0,
    records_failed: failed,
    error_message: failed > 0 ? `${failed} rows failed` : undefined,
  };
}

function mapProviderRowToOurSchema(row: Record<string, unknown>, _provider: string): Record<string, unknown> {
  // Map provider-specific fields to our schema.
  // Merge.dev: first_name, last_name, etc. - often already aligned
  // ZenHR/Bayzat: different field names - add mappings here
  return {
    firstName: row.first_name ?? row.firstName,
    lastName: row.last_name ?? row.lastName,
    fullName: row.full_name ?? row.fullName,
    email: row.email,
    department: row.department ?? row.department_name,
    role: row.job_title ?? row.role ?? row.title,
    level: row.level ?? row.seniority ?? row.grade,
    location: row.location ?? row.office ?? row.work_location,
    baseSalary: row.base_salary ?? row.baseSalary ?? row.salary,
    bonus: row.bonus,
    equity: row.equity,
    currency: row.currency,
    status: row.status,
    employmentType: row.employment_type ?? row.employmentType,
    hireDate: row.hire_date ?? row.startDate,
    performanceRating: row.performance_rating ?? row.performanceRating,
  };
}

async function fetchFromProvider(_provider: string, _integrationId: string): Promise<Record<string, unknown>[]> {
  // TODO: Merge.dev: GET /api/hris/v1/employees with account_token
  // TODO: ZenHR: GET /api/employees with API key
  // TODO: Bayzat: GET /api/employees with API key
  return [];
}
