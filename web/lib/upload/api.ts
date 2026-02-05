// Supabase API functions for data upload

import { createClient } from "@/lib/supabase/client";
import type { TransformedEmployee, TransformedBenchmark } from "./transformers";

export type UploadResult = {
  success: boolean;
  insertedCount: number;
  errors: string[];
};

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

/**
 * Upload employees to the database
 */
export async function uploadEmployees(
  employees: TransformedEmployee[],
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  const supabase = createClient();
  const workspaceId = await getWorkspaceId();
  
  if (!workspaceId) {
    return { success: false, insertedCount: 0, errors: ["No workspace found"] };
  }
  
  const errors: string[] = [];
  let insertedCount = 0;
  const batchSize = 50;
  
  // Process in batches
  for (let i = 0; i < employees.length; i += batchSize) {
    const batch = employees.slice(i, i + batchSize);
    
    const records = batch.map((emp) => ({
      workspace_id: workspaceId,
      first_name: emp.firstName,
      last_name: emp.lastName,
      email: emp.email,
      department: emp.department,
      role_id: emp.roleId,
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
    
    const { data, error } = await supabase
      .from("employees")
      .insert(records)
      .select("id");
    
    if (error) {
      errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
    } else {
      insertedCount += data?.length || 0;
    }
    
    // Report progress
    if (onProgress) {
      onProgress(Math.min(100, Math.round(((i + batch.length) / employees.length) * 100)));
    }
  }
  
  return {
    success: errors.length === 0,
    insertedCount,
    errors,
  };
}

/**
 * Upload benchmarks to the database (upsert)
 */
export async function uploadBenchmarks(
  benchmarks: TransformedBenchmark[],
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  const supabase = createClient();
  const workspaceId = await getWorkspaceId();
  
  if (!workspaceId) {
    return { success: false, insertedCount: 0, errors: ["No workspace found"] };
  }
  
  const errors: string[] = [];
  let insertedCount = 0;
  const batchSize = 50;
  
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
      valid_from: new Date().toISOString().split("T")[0],
    }));
    
    // Use upsert to handle duplicates
    const { data, error } = await supabase
      .from("salary_benchmarks")
      .upsert(records, {
        onConflict: "workspace_id,role_id,location_id,level_id,valid_from",
      })
      .select("id");
    
    if (error) {
      errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
    } else {
      insertedCount += data?.length || 0;
    }
    
    // Report progress
    if (onProgress) {
      onProgress(Math.min(100, Math.round(((i + batch.length) / benchmarks.length) * 100)));
    }
  }
  
  return {
    success: errors.length === 0,
    insertedCount,
    errors,
  };
}

/**
 * Create an audit record for the upload
 */
export async function createUploadRecord(params: {
  uploadType: "employees" | "benchmarks" | "compensation";
  fileName: string;
  fileSize: number;
  rowCount: number;
  successCount: number;
  errorCount: number;
  errors: string[];
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
    uploaded_by: userId,
  });
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
  
  await supabase
    .from("employees")
    .delete()
    .eq("workspace_id", workspaceId);
}

/**
 * Delete all benchmarks for the workspace (for re-upload)
 */
export async function clearBenchmarks(): Promise<void> {
  const supabase = createClient();
  const workspaceId = await getWorkspaceId();
  
  if (!workspaceId) return;
  
  await supabase
    .from("salary_benchmarks")
    .delete()
    .eq("workspace_id", workspaceId);
}
