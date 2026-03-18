// Supabase API functions for data upload

import { createClient } from "@/lib/supabase/client";
import { fetchDbEmployees } from "@/lib/employees";
import type {
  TransformedBenchmark,
  TransformedCompensationUpdate,
  TransformedEmployee,
} from "./transformers";
import { normalize } from "./transformers";
import type { UploadDataType } from "./column-detection";
import type { UploadImportMode } from "./upload-state";

export type UploadResult = {
  success: boolean;
  insertedCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  errors: string[];
  processedEmployees?: UploadProcessedEmployee[];
  processedBenchmarks?: UploadProcessedBenchmark[];
};

export type UploadProcessedEmployee = {
  email: string;
  firstName: string;
  lastName: string;
  action: "created" | "updated";
};

export type UploadProcessedBenchmark = {
  roleId: string;
  locationId: string;
  levelId: string;
  validFrom: string;
  action: "created" | "updated";
};

type UploadOptions = {
  mode?: UploadImportMode;
};

export type UploadVerificationSummary = {
  headline: string;
  details: string[];
  links: Array<{ href: string; label: string }>;
};

async function refreshMarketPool(): Promise<void> {
  const response = await fetch("/api/benchmarks/market-pool/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error("Failed to refresh the Qeemly market pool after import.");
  }
}

async function refreshCoverageSnapshot(): Promise<void> {
  const response = await fetch("/api/benchmarks/coverage/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error("Failed to refresh benchmark coverage after import.");
  }
}

/**
 * Get the current user's workspace ID
 */
async function getWorkspaceId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user.id)
    .single();
  
  return profile?.workspace_id || null;
}

/**
 * Get current user ID for audit
 */
async function getUserId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

function createInitialUploadResult(): UploadResult {
  return {
    success: true,
    insertedCount: 0,
    createdCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    errors: [],
    processedEmployees: [],
    processedBenchmarks: [],
  };
}

async function applyCanonicalRoleAliases(
  supabase: ReturnType<typeof createClient>,
  workspaceId: string,
  employees: TransformedEmployee[],
): Promise<TransformedEmployee[]> {
  const unresolvedEmployees = employees.filter(
    (employee) => employee.roleMappingStatus === "pending" && employee.originalRoleText,
  );
  if (unresolvedEmployees.length === 0) {
    return employees;
  }

  let data:
    | Array<{ canonical_role_id?: string | null; alias_normalized?: string | null; workspace_id?: string | null }>
    | null = null;
  let error: { message?: string } | null = null;
  try {
    const result = await supabase
      .from("canonical_role_aliases")
      .select("canonical_role_id,alias_normalized,workspace_id")
      .eq("is_active", true);
    data = result.data as typeof data;
    error = result.error ?? null;
  } catch {
    return employees;
  }

  if (error || !data) {
    return employees;
  }

  const aliasToRoleId = new Map<string, string>();
  for (const row of data) {
    const scopedWorkspaceId = row.workspace_id ? String(row.workspace_id) : null;
    if (scopedWorkspaceId && scopedWorkspaceId !== workspaceId) continue;
    if (!row.alias_normalized || !row.canonical_role_id) continue;
    aliasToRoleId.set(String(row.alias_normalized), String(row.canonical_role_id));
  }

  return employees.map((employee) => {
    if (employee.roleMappingStatus !== "pending" || !employee.originalRoleText) {
      return employee;
    }

    const aliasedRoleId = aliasToRoleId.get(normalize(employee.originalRoleText));
    if (!aliasedRoleId) {
      return employee;
    }

    return {
      ...employee,
      roleId: aliasedRoleId,
      canonicalRoleId: aliasedRoleId,
      roleMappingConfidence: "high",
      roleMappingStatus: employee.levelId ? "mapped" : "pending",
    };
  });
}

function toBenchmarkConflictKey(row: {
  role_id: string;
  location_id: string;
  level_id: string;
  valid_from: string;
  industry_key?: string | null;
  company_size_key?: string | null;
}) {
  return [
    row.role_id,
    row.location_id,
    row.level_id,
    row.industry_key ?? "",
    row.company_size_key ?? "",
    row.valid_from,
  ].join("|");
}

function isMissingColumnError(error: { message?: string } | null | undefined, columnName: string): boolean {
  if (!error?.message) return false;
  return error.message.toLowerCase().includes(`column salary_benchmarks.${columnName}`.toLowerCase());
}

/**
 * Upload employees to the database
 */
export async function uploadEmployees(
  employees: TransformedEmployee[],
  onProgress?: (progress: number) => void,
  options?: UploadOptions,
): Promise<UploadResult> {
  const supabase = createClient();
  const workspaceId = await getWorkspaceId();
  const importMode = options?.mode ?? "upsert";
  
  if (!workspaceId) {
    return {
      ...createInitialUploadResult(),
      success: false,
      errors: ["No workspace found"],
    };
  }

  const result = createInitialUploadResult();
  const batchSize = 50;
  const pendingReviewRows: Array<{
    workspace_id: string;
    subject_type: "employee";
    subject_id: string;
    original_role_text: string;
    proposed_canonical_role_id: string | null;
    status: "pending";
    review_reason: string;
  }> = [];

  if (importMode === "replace") {
    await clearEmployees();
  }

  const employeesWithAliases = await applyCanonicalRoleAliases(supabase, workspaceId, employees);

  const emailMatches = employeesWithAliases
    .map((employee) => employee.email?.toLowerCase())
    .filter((email): email is string => Boolean(email));
  const existingEmployeesByEmail = new Map<string, string>();
  const crossWorkspaceEmails = new Set<string>();

  if (importMode === "upsert" && emailMatches.length > 0) {
    const { data, error } = await supabase
      .from("employees")
      .select("id,email,workspace_id")
      .in("email", Array.from(new Set(emailMatches)));

    if (error) {
      result.errors.push(`Unable to read existing employees: ${error.message}`);
      result.success = false;
      return result;
    }

    for (const row of data || []) {
      if (row.email) {
        const normalizedEmail = String(row.email).toLowerCase();
        if (String(row.workspace_id) === workspaceId) {
          existingEmployeesByEmail.set(normalizedEmail, String(row.id));
        } else {
          crossWorkspaceEmails.add(normalizedEmail);
        }
      }
    }
  }
  
  // Process in batches
  for (let i = 0; i < employeesWithAliases.length; i += batchSize) {
    const batch = employeesWithAliases.slice(i, i + batchSize);
    const records = batch.map((emp) => ({
      workspace_id: workspaceId,
      first_name: emp.firstName,
      last_name: emp.lastName,
      email: emp.email,
      department: emp.department,
      role_id: emp.roleId,
      canonical_role_id: emp.canonicalRoleId,
      original_role_text: emp.originalRoleText,
      original_level_text: emp.originalLevelText,
      role_mapping_confidence: emp.roleMappingConfidence,
      role_mapping_source: emp.roleMappingSource,
      role_mapping_status: emp.roleMappingStatus,
      level_id: emp.levelId,
      location_id: emp.locationId,
      base_salary: emp.baseSalary,
      bonus: emp.bonus,
      equity: emp.equity,
      currency: emp.currency,
      status: emp.status,
      employment_type: emp.employmentType,
      hire_date: emp.hireDate,
      performance_rating: emp.performanceRating,
    }));

    const withEmail = records.filter(
      (record) => Boolean(record.email) && !crossWorkspaceEmails.has(String(record.email).toLowerCase()),
    );
    const withoutEmail = records.filter((record) => !record.email);
    const employeeByEmail = new Map<string, string>();

    for (const record of records) {
      if (record.email && crossWorkspaceEmails.has(String(record.email).toLowerCase())) {
        result.errors.push(
          `Employee email ${record.email} already exists in another workspace and cannot be imported here.`,
        );
        result.failedCount += 1;
      }
    }

    if (withEmail.length > 0) {
      const existingRows = withEmail.filter((record) =>
        existingEmployeesByEmail.has(String(record.email).toLowerCase()),
      );
      const newRows = withEmail.filter(
        (record) => !existingEmployeesByEmail.has(String(record.email).toLowerCase()),
      );

      for (const record of existingRows) {
        const normalizedEmail = String(record.email).toLowerCase();
        const existingId = existingEmployeesByEmail.get(normalizedEmail);
        if (!existingId) continue;

        const { error } = await supabase
          .from("employees")
          .update(record)
          .eq("id", existingId)
          .eq("workspace_id", workspaceId);

        if (error) {
          result.errors.push(
            `Batch ${Math.floor(i / batchSize) + 1}: failed to update ${record.email}: ${error.message}`,
          );
          result.failedCount += 1;
        } else {
          result.updatedCount += 1;
          employeeByEmail.set(normalizedEmail, existingId);
          result.processedEmployees?.push({
            email: normalizedEmail,
            firstName: String(record.first_name || ""),
            lastName: String(record.last_name || ""),
            action: "updated",
          });
          const sourceEmployee = batch.find(
            (employee) => String(employee.email || "").toLowerCase() === normalizedEmail,
          );
          if (sourceEmployee?.roleMappingStatus === "pending" && sourceEmployee.originalRoleText) {
            pendingReviewRows.push({
              workspace_id: workspaceId,
              subject_type: "employee",
              subject_id: existingId,
              original_role_text: sourceEmployee.originalRoleText,
              proposed_canonical_role_id: sourceEmployee.canonicalRoleId,
              status: "pending",
              review_reason: "Upload produced an unresolved or low-confidence role mapping.",
            });
          }
        }
      }

      if (newRows.length > 0) {
        const { data, error } = await supabase
          .from("employees")
          .insert(newRows)
          .select("id,email");

        if (error) {
          result.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
          result.failedCount += newRows.length;
        } else {
          result.createdCount += data?.length || 0;
          for (const row of data || []) {
            if (row.email) {
              const normalizedEmail = String(row.email).toLowerCase();
              existingEmployeesByEmail.set(normalizedEmail, String(row.id));
              employeeByEmail.set(normalizedEmail, String(row.id));
              const sourceRecord = newRows.find(
                (record) => String(record.email).toLowerCase() === normalizedEmail,
              );
              result.processedEmployees?.push({
                email: normalizedEmail,
                firstName: String(sourceRecord?.first_name || ""),
                lastName: String(sourceRecord?.last_name || ""),
                action: "created",
              });
              const sourceEmployee = batch.find(
                (employee) => String(employee.email || "").toLowerCase() === normalizedEmail,
              );
              if (sourceEmployee?.roleMappingStatus === "pending" && sourceEmployee.originalRoleText) {
                pendingReviewRows.push({
                  workspace_id: workspaceId,
                  subject_type: "employee",
                  subject_id: String(row.id),
                  original_role_text: sourceEmployee.originalRoleText,
                  proposed_canonical_role_id: sourceEmployee.canonicalRoleId,
                  status: "pending",
                  review_reason: "Upload produced an unresolved or low-confidence role mapping.",
                });
              }
            }
          }
        }
      }
    }

    if (withoutEmail.length > 0) {
      const { data, error } = await supabase
        .from("employees")
        .insert(withoutEmail)
        .select("id,email");

      if (error) {
        result.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        result.failedCount += withoutEmail.length;
      } else {
        result.createdCount += data?.length || 0;
        for (const row of data || []) {
          if (row.email) {
            employeeByEmail.set(String(row.email).toLowerCase(), String(row.id));
          }
        }
      }
    }

    const enrichmentPayload = batch
      .filter((emp) => emp.avatarUrl && emp.email)
      .map((emp) => {
        const employeeId = employeeByEmail.get(String(emp.email).toLowerCase());
        if (!employeeId) return null;
        return {
          workspace_id: workspaceId,
          employee_id: employeeId,
          avatar_url: emp.avatarUrl,
          avatar_source: "upload",
          source_system: "csv_upload",
          source_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    if (enrichmentPayload.length > 0) {
      await supabase
        .from("employee_profile_enrichment")
        .upsert(enrichmentPayload, { onConflict: "employee_id" });
    }

    const visaPayload = batch
      .filter((emp) => (emp.visaType || emp.visaStatus || emp.visaExpiryDate) && emp.email)
      .map((emp) => {
        const employeeId = employeeByEmail.get(String(emp.email).toLowerCase());
        if (!employeeId) return null;
        return {
          workspace_id: workspaceId,
          employee_id: employeeId,
          visa_type: emp.visaType || "work_permit",
          visa_status: emp.visaStatus || "active",
          sponsor_name: emp.visaSponsor || null,
          permit_id: emp.visaPermitId || null,
          issue_date: emp.visaIssueDate || null,
          expiry_date: emp.visaExpiryDate || null,
          source_system: "upload",
          source_reference: "employee_csv",
          source_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    if (visaPayload.length > 0) {
      const visaEmployeeIds = Array.from(new Set(visaPayload.map((entry) => entry.employee_id)));
      await supabase
        .from("employee_visa_records")
        .delete()
        .eq("workspace_id", workspaceId)
        .in("employee_id", visaEmployeeIds);
      await supabase.from("employee_visa_records").insert(visaPayload);
    }
    
    // Report progress
    if (onProgress) {
      onProgress(Math.min(100, Math.round(((i + batch.length) / employeesWithAliases.length) * 100)));
    }
  }

  result.insertedCount = result.createdCount + result.updatedCount;
  result.success = result.errors.length === 0;

  if (result.insertedCount > 0) {
    if (pendingReviewRows.length > 0) {
      try {
        await supabase.from("role_mapping_reviews").insert(pendingReviewRows);
      } catch {
        // Review queue persistence is best-effort during uploads.
      }
    }
    try {
      await refreshMarketPool();
    } catch {
      // Market-pool refresh is best-effort during uploads.
    }
    try {
      await refreshCoverageSnapshot();
    } catch {
      // Coverage refresh is best-effort during uploads.
    }
  }

  return result;
}

/**
 * Upload benchmarks to the database (upsert)
 */
export async function uploadBenchmarks(
  benchmarks: TransformedBenchmark[],
  onProgress?: (progress: number) => void,
  options?: UploadOptions,
): Promise<UploadResult> {
  const supabase = createClient();
  const workspaceId = await getWorkspaceId();
  const importMode = options?.mode ?? "upsert";
  
  if (!workspaceId) {
    return {
      ...createInitialUploadResult(),
      success: false,
      errors: ["No workspace found"],
    };
  }

  const result = createInitialUploadResult();
  const batchSize = 50;
  const validFrom = new Date().toISOString().split("T")[0];
  const existingKeys = new Set<string>();
  let useSegmentedConflictKey = true;

  if (importMode === "replace") {
    await clearBenchmarks();
  } else {
    let data:
      | Array<{
          role_id: string;
          location_id: string;
          level_id: string;
          valid_from: string;
          industry_key?: string | null;
          company_size_key?: string | null;
        }>
      | null = null;
    let error: { message?: string } | null = null;

    const segmentedResult = await supabase
      .from("salary_benchmarks")
      .select("role_id,location_id,level_id,industry_key,company_size_key,valid_from")
      .eq("workspace_id", workspaceId);
    data = segmentedResult.data;
    error = segmentedResult.error;

    if (isMissingColumnError(error, "industry_key") || isMissingColumnError(error, "company_size_key")) {
      useSegmentedConflictKey = false;
      const legacyResult = await supabase
        .from("salary_benchmarks")
        .select("role_id,location_id,level_id,valid_from")
        .eq("workspace_id", workspaceId);
      data = legacyResult.data;
      error = legacyResult.error;
    }

    if (error) {
      result.errors.push(`Unable to read existing benchmarks: ${error.message}`);
      result.success = false;
      return result;
    }

    for (const row of data || []) {
      existingKeys.add(toBenchmarkConflictKey({
        role_id: String(row.role_id),
        location_id: String(row.location_id),
        level_id: String(row.level_id),
        valid_from: String(row.valid_from),
        industry_key: useSegmentedConflictKey && row.industry_key ? String(row.industry_key) : null,
        company_size_key:
          useSegmentedConflictKey && row.company_size_key ? String(row.company_size_key) : null,
      }));
    }
  }
  
  // Process in batches
  for (let i = 0; i < benchmarks.length; i += batchSize) {
    const batch = benchmarks.slice(i, i + batchSize);
    
    const records = batch.map((bm) => ({
      workspace_id: workspaceId,
      role_id: bm.roleId,
      location_id: bm.locationId,
      level_id: bm.levelId,
      currency: bm.currency,
      p10: bm.p10,
      p25: bm.p25,
      p50: bm.p50,
      p75: bm.p75,
      p90: bm.p90,
      sample_size: bm.sampleSize,
      source: "uploaded",
      valid_from: validFrom,
    }));

    const batchUpdatedCount = records.filter((record) =>
      existingKeys.has(
        toBenchmarkConflictKey({
          role_id: String(record.role_id),
          location_id: String(record.location_id),
          level_id: String(record.level_id),
          valid_from: String(record.valid_from),
        }),
      ),
    ).length;

    const { data, error } = await supabase
      .from("salary_benchmarks")
      .upsert(records, {
        onConflict: useSegmentedConflictKey
          ? "workspace_id,role_id,location_id,level_id,industry_key,company_size_key,valid_from"
          : "workspace_id,role_id,location_id,level_id,valid_from",
      })
      .select("id");
    
    if (error) {
      result.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      result.failedCount += batch.length;
    } else {
      result.updatedCount += batchUpdatedCount;
      result.createdCount += batch.length - batchUpdatedCount;
      for (const record of records) {
          const action = existingKeys.has(
            toBenchmarkConflictKey({
              role_id: String(record.role_id),
              location_id: String(record.location_id),
              level_id: String(record.level_id),
              valid_from: String(record.valid_from),
            }),
          )
            ? "updated"
            : "created";
        existingKeys.add(
          toBenchmarkConflictKey({
            role_id: String(record.role_id),
            location_id: String(record.location_id),
            level_id: String(record.level_id),
            valid_from: String(record.valid_from),
          }),
        );
          result.processedBenchmarks?.push({
            roleId: String(record.role_id),
            locationId: String(record.location_id),
            levelId: String(record.level_id),
            validFrom: String(record.valid_from),
            action,
          });
      }
    }
    
    // Report progress
    if (onProgress) {
      onProgress(Math.min(100, Math.round(((i + batch.length) / benchmarks.length) * 100)));
    }
  }

  result.insertedCount = result.createdCount + result.updatedCount;
  result.success = result.errors.length === 0;

  if (result.insertedCount > 0) {
    try {
      const freshnessResponse = await fetch("/api/benchmarks/freshness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordCount: result.insertedCount }),
      });
      if (!freshnessResponse.ok) {
        throw new Error("Failed to update benchmark freshness after import.");
      }
    } catch {
      // Freshness sync is best-effort; uploaded benchmark rows should still succeed.
    }
    try {
      await refreshMarketPool();
    } catch {
      // Market-pool refresh is best-effort during uploads.
    }
    try {
      await refreshCoverageSnapshot();
    } catch {
      // Coverage refresh is best-effort during uploads.
    }
  }
  
  return result;
}

export async function uploadCompensationUpdates(
  updates: TransformedCompensationUpdate[],
  onProgress?: (progress: number) => void,
): Promise<UploadResult> {
  const supabase = createClient();
  const workspaceId = await getWorkspaceId();

  if (!workspaceId) {
    return {
      ...createInitialUploadResult(),
      success: false,
      errors: ["No workspace found"],
    };
  }

  const result = createInitialUploadResult();
  const emails = Array.from(new Set(updates.map((update) => update.email)));
  const { data: existingEmployees, error: lookupError } = await supabase
    .from("employees")
    .select("id,email,currency,base_salary,bonus,equity")
    .eq("workspace_id", workspaceId)
    .in("email", emails);

  if (lookupError) {
    result.success = false;
    result.errors.push(`Unable to read existing employees: ${lookupError.message}`);
    return result;
  }

  const existingByEmail = new Map<
    string,
    {
      id: string;
      currency: string | null;
      base_salary: number | null;
      bonus: number | null;
      equity: number | null;
    }
  >();
  for (const row of existingEmployees || []) {
    if (row.email) {
      existingByEmail.set(String(row.email).toLowerCase(), {
        id: String(row.id),
        currency: row.currency ? String(row.currency) : null,
        base_salary: row.base_salary == null ? null : Number(row.base_salary),
        bonus: row.bonus == null ? null : Number(row.bonus),
        equity: row.equity == null ? null : Number(row.equity),
      });
    }
  }

  const historyPayload: Array<{
    employee_id: string;
    effective_date: string;
    base_salary: number;
    bonus: number;
    equity: number;
    currency: string | null;
    change_reason: string | null;
    change_percentage: number | null;
  }> = [];

  for (let i = 0; i < updates.length; i += 1) {
    const update = updates[i];
    const existing = existingByEmail.get(update.email);

    if (!existing) {
      result.errors.push(`No employee found for ${update.email}`);
      result.failedCount += 1;
      continue;
    }

    const employeeUpdate: Record<string, string | number | null> = {
      base_salary: update.baseSalary,
      updated_at: new Date().toISOString(),
    };
    if (update.bonus !== null) {
      employeeUpdate.bonus = update.bonus;
    }
    if (update.equity !== null) {
      employeeUpdate.equity = update.equity;
    }

    const { error } = await supabase
      .from("employees")
      .update(employeeUpdate)
      .eq("id", existing.id)
      .eq("workspace_id", workspaceId);

    if (error) {
      result.errors.push(`Failed to update ${update.email}: ${error.message}`);
      result.failedCount += 1;
      continue;
    }

    const previousBase = existing.base_salary ?? 0;
    const changePercentage =
      previousBase > 0 ? Math.round(((update.baseSalary - previousBase) / previousBase) * 10000) / 100 : null;

    historyPayload.push({
      employee_id: existing.id,
      effective_date: update.effectiveDate ?? new Date().toISOString().slice(0, 10),
      base_salary: update.baseSalary,
      bonus: update.bonus ?? existing.bonus ?? 0,
      equity: update.equity ?? existing.equity ?? 0,
      currency: existing.currency,
      change_reason: update.changeReason,
      change_percentage: changePercentage,
    });
    result.updatedCount += 1;

    if (onProgress) {
      onProgress(Math.min(100, Math.round(((i + 1) / updates.length) * 100)));
    }
  }

  if (historyPayload.length > 0) {
    const { error } = await supabase.from("compensation_history").insert(historyPayload);
    if (error) {
      result.errors.push(`Failed to write compensation history: ${error.message}`);
      result.success = false;
      return result;
    }
  }

  result.insertedCount = result.updatedCount;
  result.success = result.errors.length === 0;

  if (result.insertedCount > 0) {
    try {
      await refreshMarketPool();
    } catch {
      // Market-pool refresh is best-effort during uploads.
    }
  }

  return result;
}

/**
 * Create an audit record for the upload
 */
export async function createUploadRecord(params: {
  uploadType: UploadDataType;
  fileName: string;
  fileSize: number;
  rowCount: number;
  successCount: number;
  errorCount: number;
  errors: string[];
  createdCount?: number;
  updatedCount?: number;
  skippedCount?: number;
  verificationSummary?: Record<string, unknown> | null;
}): Promise<void> {
  const supabase = createClient();
  const workspaceId = await getWorkspaceId();
  const userId = await getUserId();
  
  if (!workspaceId) return;
  
  await supabase.from("data_uploads").insert({
    workspace_id: workspaceId,
    upload_type: params.uploadType,
    file_name: params.fileName,
    file_size: params.fileSize,
    row_count: params.rowCount,
    success_count: params.successCount,
    error_count: params.errorCount,
    errors: params.errors.length > 0 ? params.errors : null,
    created_count: params.createdCount ?? 0,
    updated_count: params.updatedCount ?? 0,
    skipped_count: params.skippedCount ?? 0,
    verification_summary: params.verificationSummary ?? null,
    uploaded_by: userId,
  });
}

export async function fetchUploadVerificationSummary(
  uploadType: UploadDataType,
  options?: { uploadedCount?: number },
): Promise<UploadVerificationSummary | null> {
  if (uploadType === "employees" || uploadType === "compensation") {
    const response = await fetch("/api/dashboard/company-overview?refresh=1", {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok) return null;

    const payload = await response.json();
    const activeEmployees = Number(payload?.benchmarkCoverage?.activeEmployees ?? 0);
    const benchmarkedEmployees = Number(payload?.benchmarkCoverage?.benchmarkedEmployees ?? 0);
    const unbenchmarkedEmployees = Number(payload?.benchmarkCoverage?.unbenchmarkedEmployees ?? 0);
    const marketBacked = Number(payload?.benchmarkTrust?.marketBacked ?? 0);

    return {
      headline:
        activeEmployees > 0
          ? `${benchmarkedEmployees} of ${activeEmployees} active employees currently have benchmark coverage.`
          : "Your company data was imported, but Company Overview is still waiting for active employees.",
      details: [
        `${marketBacked} employee matches are currently backed by Qeemly market data.`,
        unbenchmarkedEmployees > 0
          ? `${unbenchmarkedEmployees} still need role, level, or location mapping before they can influence company insights.`
          : "All active employees currently have benchmark coverage.",
      ],
      links: [
        { href: "/dashboard/overview", label: "Open Company Overview" },
        { href: "/dashboard/salary-review", label: "Open Salary Review" },
      ],
    };
  }

  if (uploadType === "benchmarks") {
    const response = await fetch("/api/benchmarks/market-insights", {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok) return null;

    const payload = await response.json();
    const overlayCount = Number(payload?.workspaceOverlay?.count ?? 0);
    const contributorQualifiedRows = Number(payload?.summary?.contributorQualifiedRows ?? 0);
    const effectiveOverlayCount = overlayCount > 0 ? overlayCount : Number(options?.uploadedCount ?? 0);

    return {
      headline:
        effectiveOverlayCount > 0
          ? `${effectiveOverlayCount} company benchmark rows from this upload are now available to review as your workspace overlay.`
          : "Your benchmark upload completed. Review the uploaded rows below and open Benchmarking to confirm the overlay.",
      details: [
        "Qeemly market data remains the primary benchmark source used across the product.",
        `${contributorQualifiedRows} contributor-qualified rows belong to the shared Qeemly market pool, not your uploaded company overlay.`,
      ],
      links: [
        { href: "/dashboard/benchmarks", label: "Open Benchmarking" },
        { href: "/dashboard/salary-review", label: "Open Salary Review" },
      ],
    };
  }

  return null;
}

export async function fetchUploadedEmployeeResults(
  processedEmployees: UploadProcessedEmployee[],
) {
  if (processedEmployees.length === 0) return [];

  const employees = await fetchDbEmployees();
  const emails = new Set(processedEmployees.map((employee) => employee.email.toLowerCase()));
  return employees.filter((employee) => emails.has(employee.email.toLowerCase()));
}

export async function fetchUploadedBenchmarkResults(
  processedBenchmarks: UploadProcessedBenchmark[],
) {
  if (processedBenchmarks.length === 0) return [];

  const workspaceId = await getWorkspaceId();
  if (!workspaceId) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("salary_benchmarks")
    .select("role_id,location_id,level_id,currency,p25,p50,p75,sample_size,valid_from,source")
    .eq("workspace_id", workspaceId);
  if (error) return [];

  const keys = new Set(
    processedBenchmarks.map(
      (benchmark) =>
        `${benchmark.roleId}::${benchmark.locationId}::${benchmark.levelId}::${benchmark.validFrom}`,
    ),
  );

  return (data || []).filter((benchmark) =>
    keys.has(
      `${benchmark.role_id}::${benchmark.location_id}::${benchmark.level_id}::${benchmark.valid_from ?? ""}`,
    ),
  );
}

/**
 * Get recent uploads for the workspace
 */
export async function getRecentUploads(limit = 10) {
  const supabase = createClient();
  const workspaceId = await getWorkspaceId();
  
  if (!workspaceId) return [];
  
  const { data } = await supabase
    .from("data_uploads")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);
  
  return data || [];
}

/**
 * Get employee count for the workspace
 */
export async function getEmployeeCount(): Promise<number> {
  const supabase = createClient();
  const workspaceId = await getWorkspaceId();
  
  if (!workspaceId) return 0;
  
  const { count } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  
  return count || 0;
}

/**
 * Get benchmark count for the workspace
 */
export async function getBenchmarkCount(): Promise<number> {
  const supabase = createClient();
  const workspaceId = await getWorkspaceId();
  
  if (!workspaceId) return 0;
  
  const { count } = await supabase
    .from("salary_benchmarks")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  
  return count || 0;
}

/**
 * Delete all employees for the workspace (for re-upload)
 */
export async function clearEmployees(): Promise<void> {
  const supabase = createClient();
  const workspaceId = await getWorkspaceId();
  
  if (!workspaceId) return;
  
  const { error } = await supabase
    .from("employees")
    .delete()
    .eq("workspace_id", workspaceId);
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Delete all benchmarks for the workspace (for re-upload)
 */
export async function clearBenchmarks(): Promise<void> {
  const supabase = createClient();
  const workspaceId = await getWorkspaceId();
  
  if (!workspaceId) return;
  
  const { error } = await supabase
    .from("salary_benchmarks")
    .delete()
    .eq("workspace_id", workspaceId);
  if (error) {
    throw new Error(error.message);
  }
}
