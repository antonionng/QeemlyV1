import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { refreshPlatformMarketPoolBestEffort } from "@/lib/benchmarks/platform-market-sync";
import { refreshBenchmarkCoverageSnapshot } from "@/lib/benchmarks/coverage-snapshots";
import { upsertBenchmarksFreshness } from "@/lib/ingestion/freshness";
import { normalize } from "@/lib/upload/transformers";
import type {
  TransformedBenchmark,
  TransformedCompensationUpdate,
  TransformedEmployee,
} from "@/lib/upload/transformers";
import type { UploadDataType } from "@/lib/upload/column-detection";
import type { UploadImportMode } from "@/lib/upload/upload-state";

type UploadResult = {
  success: boolean;
  insertedCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  errors: string[];
  processedEmployees?: Array<{
    email: string;
    firstName: string;
    lastName: string;
    action: "created" | "updated";
  }>;
  processedBenchmarks?: Array<{
    roleId: string;
    locationId: string;
    levelId: string;
    validFrom: string;
    action: "created" | "updated";
  }>;
};

type UploadQueryClient =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createServiceClient>;

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
  queryClient: UploadQueryClient,
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
    const result = await queryClient
      .from("canonical_role_aliases")
      .select("canonical_role_id,alias_normalized,workspace_id")
      .eq("is_active", true);
    data = result.data as typeof data;
    error = result.error ?? null;
  } catch {
    return employees;
  }

  if (error || !data || !Array.isArray(data)) {
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

async function importEmployees(
  queryClient: UploadQueryClient,
  workspaceId: string,
  employees: TransformedEmployee[],
  importMode: UploadImportMode,
): Promise<UploadResult> {
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
    const { error } = await queryClient
      .from("employees")
      .delete()
      .eq("workspace_id", workspaceId);
    if (error) {
      result.success = false;
      result.errors.push(error.message);
      return result;
    }
  }

  const employeesWithAliases = await applyCanonicalRoleAliases(queryClient, workspaceId, employees);

  const emailMatches = employeesWithAliases
    .map((employee) => employee.email?.toLowerCase())
    .filter((email): email is string => Boolean(email));
  const existingEmployeesByEmail = new Map<string, string>();
  const crossWorkspaceEmails = new Set<string>();

  if (importMode === "upsert" && emailMatches.length > 0) {
    const { data, error } = await queryClient
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

  for (let i = 0; i < employeesWithAliases.length; i += batchSize) {
    const batch = employeesWithAliases.slice(i, i + batchSize);
    const validBatch = batch.filter((emp) => {
      if (emp.roleId && emp.levelId && emp.locationId) return true;
      const employeeLabel = [emp.firstName, emp.lastName].filter(Boolean).join(" ").trim() || "This employee";
      const identifier = emp.email ? `${employeeLabel} (${emp.email})` : employeeLabel;
      if (!emp.roleId) {
        result.errors.push(
          `${identifier} could not be imported because the role title could not be mapped to a supported Qeemly role.`,
        );
      } else if (!emp.levelId) {
        result.errors.push(
          `${identifier} could not be imported because the level could not be mapped to a supported Qeemly level.`,
        );
      } else {
        result.errors.push(
          `${identifier} could not be imported because the location could not be mapped to a supported Qeemly location.`,
        );
      }
      result.failedCount += 1;
      return false;
    });

    const records = validBatch.map((emp) => ({
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

        const { error } = await queryClient
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
        const { data, error } = await queryClient
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
      const { data, error } = await queryClient
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
      await queryClient
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
      await queryClient
        .from("employee_visa_records")
        .delete()
        .eq("workspace_id", workspaceId)
        .in("employee_id", visaEmployeeIds);
      await queryClient.from("employee_visa_records").insert(visaPayload);
    }
  }

  result.insertedCount = result.createdCount + result.updatedCount;
  result.success = result.errors.length === 0;

  if (result.insertedCount > 0) {
    if (pendingReviewRows.length > 0) {
      try {
        await queryClient.from("role_mapping_reviews").insert(pendingReviewRows);
      } catch {
        // Best effort only.
      }
    }
    try {
      await refreshPlatformMarketPoolBestEffort();
    } catch {
      // Best effort only.
    }
    try {
      await refreshBenchmarkCoverageSnapshot(workspaceId);
    } catch {
      // Best effort only.
    }
  }

  return result;
}

async function importBenchmarks(
  queryClient: UploadQueryClient,
  workspaceId: string,
  benchmarks: TransformedBenchmark[],
  importMode: UploadImportMode,
): Promise<UploadResult> {
  const result = createInitialUploadResult();
  const batchSize = 50;
  const validFrom = new Date().toISOString().split("T")[0];
  const existingKeys = new Set<string>();
  let useSegmentedConflictKey = true;

  if (importMode === "replace") {
    const { error } = await queryClient
      .from("salary_benchmarks")
      .delete()
      .eq("workspace_id", workspaceId);
    if (error) {
      result.success = false;
      result.errors.push(error.message);
      return result;
    }
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

    const segmentedResult = await queryClient
      .from("salary_benchmarks")
      .select("role_id,location_id,level_id,industry_key,company_size_key,valid_from")
      .eq("workspace_id", workspaceId);
    data = segmentedResult.data;
    error = segmentedResult.error;

    if (isMissingColumnError(error, "industry_key") || isMissingColumnError(error, "company_size_key")) {
      useSegmentedConflictKey = false;
      const legacyResult = await queryClient
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
      existingKeys.add(
        toBenchmarkConflictKey({
          role_id: String(row.role_id),
          location_id: String(row.location_id),
          level_id: String(row.level_id),
          valid_from: String(row.valid_from),
          industry_key: useSegmentedConflictKey && row.industry_key ? String(row.industry_key) : null,
          company_size_key:
            useSegmentedConflictKey && row.company_size_key ? String(row.company_size_key) : null,
        }),
      );
    }
  }

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

    const { error } = await queryClient
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
  }

  result.insertedCount = result.createdCount + result.updatedCount;
  result.success = result.errors.length === 0;

  if (result.insertedCount > 0) {
    try {
      await upsertBenchmarksFreshness(workspaceId, result.insertedCount, null);
    } catch {
      // Best effort only.
    }
    try {
      await refreshPlatformMarketPoolBestEffort();
    } catch {
      // Best effort only.
    }
    try {
      await refreshBenchmarkCoverageSnapshot(workspaceId);
    } catch {
      // Best effort only.
    }
  }

  return result;
}

async function importCompensationUpdates(
  queryClient: UploadQueryClient,
  workspaceId: string,
  updates: TransformedCompensationUpdate[],
): Promise<UploadResult> {
  const result = createInitialUploadResult();
  const emails = Array.from(new Set(updates.map((update) => update.email)));
  const { data: existingEmployees, error: lookupError } = await queryClient
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

  for (const update of updates) {
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
    if (update.bonus !== null) employeeUpdate.bonus = update.bonus;
    if (update.equity !== null) employeeUpdate.equity = update.equity;

    const { error } = await queryClient
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
  }

  if (historyPayload.length > 0) {
    const { error } = await queryClient.from("compensation_history").insert(historyPayload);
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
      await refreshPlatformMarketPoolBestEffort();
    } catch {
      // Best effort only.
    }
  }

  return result;
}

export async function POST(request: Request) {
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const supabase = await createClient();
  const queryClient = wsContext.context.is_override ? createServiceClient() : supabase;

  try {
    const body = (await request.json()) as {
      uploadType?: UploadDataType;
      rows?: unknown[];
      mode?: UploadImportMode;
    };

    const uploadType = body.uploadType;
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const mode = body.mode === "replace" ? "replace" : "upsert";

    if (!uploadType) {
      return NextResponse.json({ error: "uploadType is required" }, { status: 400 });
    }

    if (uploadType === "employees") {
      const result = await importEmployees(
        queryClient,
        wsContext.context.workspace_id,
        rows as TransformedEmployee[],
        mode,
      );
      return NextResponse.json(result);
    }

    if (uploadType === "benchmarks") {
      const result = await importBenchmarks(
        queryClient,
        wsContext.context.workspace_id,
        rows as TransformedBenchmark[],
        mode,
      );
      return NextResponse.json(result);
    }

    if (uploadType === "compensation") {
      const result = await importCompensationUpdates(
        queryClient,
        wsContext.context.workspace_id,
        rows as TransformedCompensationUpdate[],
      );
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unsupported upload type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import upload batch" },
      { status: 500 },
    );
  }
}
