"use client";

import { useState } from "react";
import {
  Upload,
  Check,
  AlertCircle,
  Users,
  BarChart3,
  DollarSign,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import {
  useUploadStore,
  buildUploadedBenchmarkPreviewRows,
  getConfirmSummaryCopy,
  getImportSummary,
  getRowsToImport,
  fetchUploadVerificationSummary,
  fetchUploadedBenchmarkResults,
  fetchUploadedEmployeeResults,
  buildUploadedEmployeePreviewRows,
  uploadEmployees,
  uploadBenchmarks,
  uploadCompensationUpdates,
  createUploadRecord,
  transformEmployee,
  transformBenchmark,
  transformCompensationUpdate,
  type TransformedEmployee,
  type TransformedBenchmark,
  type UploadResult,
  type UploadVerificationSummary,
} from "@/lib/upload";

type StepConfirmProps = {
  onSuccess?: () => void;
  onClose?: () => void;
};

export function StepConfirm({ onSuccess, onClose }: StepConfirmProps) {
  const store = useUploadStore();
  const {
    currentStep,
    dataType,
    file,
    isImporting,
    importProgress,
    importError,
    importedCount,
    importMode,
    excludedRows,
    departmentMappings,
    roleMappings,
    levelMappings,
    multiCurrencyConfirmed,
    setImporting,
    setImportProgress,
    setImportError,
    setImportedCount,
    setMultiCurrencyConfirmed,
    goToStep,
    reset,
  } = store;

  const isSuccess = currentStep === "success";
  const summary = getImportSummary(store);
  const confirmCopy = dataType ? getConfirmSummaryCopy(dataType, importMode) : null;
  const [latestResult, setLatestResult] = useState<UploadResult | null>(null);
  const [verificationSummary, setVerificationSummary] = useState<UploadVerificationSummary | null>(null);
  const [uploadedEmployeeRows, setUploadedEmployeeRows] = useState<
    ReturnType<typeof buildUploadedEmployeePreviewRows>
  >([]);
  const [uploadedBenchmarkRows, setUploadedBenchmarkRows] = useState<
    ReturnType<typeof buildUploadedBenchmarkPreviewRows>
  >([]);

  const handleImport = async () => {
    if (!dataType || !file) return;

    setImporting(true);
    setImportError(null);
    setImportProgress(0);

    try {
      const rowsToImport = getRowsToImport(store);
      let result;

      if (dataType === "employees") {
        const employees = rowsToImport
          .map((row) => transformEmployee(row.data))
          .filter((employee): employee is TransformedEmployee => employee !== null);

        result = await uploadEmployees(employees, setImportProgress, {
          mode: importMode,
          importPolicy: {
            excludedRowIndices: Array.from(excludedRows.values()),
            multiCurrencyDetected: hasMultiCurrency,
            multiCurrencyConfirmed,
            mappingSummary: {
              departmentsMapped: Object.keys(departmentMappings).length,
              rolesMapped: Object.keys(roleMappings).length,
              levelsMapped: Object.keys(levelMappings).length,
            },
          },
        });
      } else if (dataType === "benchmarks") {
        const benchmarks = rowsToImport
          .map((row) => transformBenchmark(row.data))
          .filter((benchmark): benchmark is TransformedBenchmark => benchmark !== null);

        result = await uploadBenchmarks(benchmarks, setImportProgress, { mode: importMode });
      } else {
        const compensationUpdates = rowsToImport
          .map((row) => transformCompensationUpdate(row.data))
          .filter((update): update is NonNullable<ReturnType<typeof transformCompensationUpdate>> => update !== null);

        result = await uploadCompensationUpdates(compensationUpdates, setImportProgress);
      }

      const verification = result.success
        ? await fetchUploadVerificationSummary(dataType, {
            uploadedCount:
              dataType === "benchmarks" ? result.createdCount + result.updatedCount : undefined,
          }).catch(() => null)
        : null;

      const uploadedEmployees =
        result.success && dataType === "employees" && (result.processedEmployees?.length ?? 0) > 0
          ? await fetchUploadedEmployeeResults(result.processedEmployees || []).catch(() => [])
          : [];
      const uploadedBenchmarks =
        result.success && dataType === "benchmarks" && (result.processedBenchmarks?.length ?? 0) > 0
          ? await fetchUploadedBenchmarkResults(result.processedBenchmarks || []).catch(() => [])
          : [];

      const resultWithSkips = {
        ...result,
        skippedCount: result.skippedCount + summary.excluded,
      };
      const auditVerificationSummary: Record<string, unknown> | null = verification
        ? {
            ...verification,
            importPolicyApplied: resultWithSkips.importPolicyApplied ?? {
              excludedRowCount: summary.excluded,
              multiCurrencyDetected: hasMultiCurrency,
              multiCurrencyConfirmed,
              mappingSummary: {
                departmentsMapped: Object.keys(departmentMappings).length,
                rolesMapped: Object.keys(roleMappings).length,
                levelsMapped: Object.keys(levelMappings).length,
              },
            },
          }
        : {
            importPolicyApplied: resultWithSkips.importPolicyApplied ?? {
              excludedRowCount: summary.excluded,
              multiCurrencyDetected: hasMultiCurrency,
              multiCurrencyConfirmed,
              mappingSummary: {
                departmentsMapped: Object.keys(departmentMappings).length,
                rolesMapped: Object.keys(roleMappings).length,
                levelsMapped: Object.keys(levelMappings).length,
              },
            },
          };

      setLatestResult(resultWithSkips);
      setVerificationSummary(verification);
      setUploadedEmployeeRows(
        dataType === "employees"
          ? buildUploadedEmployeePreviewRows(uploadedEmployees, result.processedEmployees || [])
          : [],
      );
      setUploadedBenchmarkRows(
        dataType === "benchmarks"
          ? buildUploadedBenchmarkPreviewRows(uploadedBenchmarks, result.processedBenchmarks || [])
          : [],
      );

      // Create audit record
      await createUploadRecord({
        uploadType: dataType,
        fileName: file.fileName,
        fileSize: file.fileSize,
        rowCount: summary.total,
        successCount: resultWithSkips.insertedCount,
        errorCount: resultWithSkips.failedCount,
        errors: resultWithSkips.errors,
        createdCount: resultWithSkips.createdCount,
        updatedCount: resultWithSkips.updatedCount,
        skippedCount: resultWithSkips.skippedCount,
        verificationSummary: auditVerificationSummary,
      });

      if (resultWithSkips.success) {
        setImportedCount(resultWithSkips.insertedCount);
        goToStep("success");
        onSuccess?.();
      } else {
        setImportError(resultWithSkips.message || resultWithSkips.errors[0] || "Import failed");
      }
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "An error occurred during import"
      );
    } finally {
      setImporting(false);
    }
  };

  const handleDone = () => {
    reset();
    onClose?.();
  };

  const getIcon = () => {
    if (dataType === "employees") return Users;
    if (dataType === "benchmarks") return BarChart3;
    return DollarSign;
  };

  const Icon = getIcon();

  const previewRows = getRowsToImport(store);
  const distributionFromField = (field: string) => {
    const counts = new Map<string, number>();
    for (const row of previewRows) {
      const value = String(row.data[field] ?? "").trim();
      if (!value) continue;
      counts.set(value, (counts.get(value) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };
  const roleDistribution = distributionFromField("role");
  const levelDistribution = distributionFromField("level");
  const departmentDistribution = distributionFromField("department");
  const currencyDistribution = distributionFromField("currency");
  const hasMultiCurrency = currencyDistribution.length > 1;

  // Success state
  if (isSuccess) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
          <Check className="h-10 w-10 text-green-600" />
        </div>

        <h2 className="text-xl font-semibold text-brand-900 mb-2">
          Import Complete!
        </h2>
        <p className="text-brand-600 text-center max-w-md mb-6">
          <span className="font-semibold text-brand-900">{importedCount} rows imported</span>
          {latestResult && (
            <>
              {" "}
              and{" "}
              <span className="font-semibold text-brand-900">
                {latestResult.failedCount + latestResult.skippedCount} rows need review
              </span>
            </>
          )}
          {" "}
          {dataType === "employees" && "employees"}
          {dataType === "benchmarks" && "benchmark records"}
          {dataType === "compensation" && "compensation updates"}
        </p>

        {latestResult && (
          <div className="mb-6 w-full max-w-2xl rounded-xl border border-border bg-white p-4">
            <div className="grid gap-3 text-sm text-brand-700 sm:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-500">Created</p>
                <p className="mt-1 text-lg font-semibold text-brand-900">{latestResult.createdCount}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-500">Updated</p>
                <p className="mt-1 text-lg font-semibold text-brand-900">{latestResult.updatedCount}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-500">Skipped</p>
                <p className="mt-1 text-lg font-semibold text-brand-900">{latestResult.skippedCount}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-500">Failed</p>
                <p className="mt-1 text-lg font-semibold text-brand-900">{latestResult.failedCount}</p>
              </div>
            </div>
          </div>
        )}

        {verificationSummary && (
          <div className="mb-6 w-full max-w-2xl rounded-xl border border-brand-200 bg-brand-50 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-500">
              Workspace status after this import
            </p>
            <p className="text-sm font-semibold text-brand-900">{verificationSummary.headline}</p>
            <div className="mt-2 space-y-1">
              {verificationSummary.details.map((detail) => (
                <p key={detail} className="text-sm text-brand-700">
                  {detail}
                </p>
              ))}
            </div>
          </div>
        )}

        {dataType === "employees" && uploadedEmployeeRows.length > 0 && (
          <div className="mb-6 w-full max-w-4xl rounded-xl border border-border bg-white p-4 text-left">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-500">
                  Uploaded employees
                </p>
                <p className="text-sm font-semibold text-brand-900">
                  These are the employees from this upload and how they map right now.
                </p>
              </div>
              <Link
                href="/dashboard/upload"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                Continue in Upload Data
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {uploadedEmployeeRows.slice(0, 8).map((employee) => (
                <div key={employee.id} className="rounded-xl border border-border bg-brand-50/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-brand-900">{employee.name}</p>
                      <p className="truncate text-xs text-brand-600">{employee.email}</p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-brand-700">
                      {employee.actionLabel}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium text-brand-700">
                    <span className="rounded-full bg-white px-2.5 py-1">{employee.roleTitle}</span>
                    <span className="rounded-full bg-white px-2.5 py-1">{employee.locationLabel}</span>
                    <span
                      className={clsx(
                        "rounded-full px-2.5 py-1",
                        employee.benchmarkLabel === "Needs mapping"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800",
                      )}
                    >
                      {employee.benchmarkLabel}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-brand-700">{employee.insightLabel}</p>
                </div>
              ))}
            </div>
            {uploadedEmployeeRows.length > 8 && (
              <p className="mt-3 text-xs text-brand-500">
                Showing the first 8 uploaded employees here. Use Upload Data to refine the full batch.
              </p>
            )}
          </div>
        )}

        {dataType === "benchmarks" && uploadedBenchmarkRows.length > 0 && (
          <div className="mb-6 w-full max-w-4xl rounded-xl border border-border bg-white p-4 text-left">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-500">
                  Uploaded benchmark rows
                </p>
                <p className="text-sm font-semibold text-brand-900">
                  These are the benchmark overlay rows from this upload batch.
                </p>
              </div>
              <Link
                href="/dashboard/benchmarks"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                Review in Benchmarking
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {uploadedBenchmarkRows.slice(0, 8).map((benchmark) => (
                <div key={benchmark.id} className="rounded-xl border border-border bg-brand-50/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-brand-900">
                        {benchmark.roleTitle}
                      </p>
                      <p className="truncate text-xs text-brand-600">
                        {benchmark.locationLabel} • {benchmark.levelLabel}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-brand-700">
                      {benchmark.actionLabel}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium text-brand-700">
                    <span className="rounded-full bg-white px-2.5 py-1">{benchmark.sampleSizeLabel}</span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">
                      Company overlay row
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-brand-700">{benchmark.insightLabel}</p>
                </div>
              ))}
            </div>
            {uploadedBenchmarkRows.length > 8 && (
              <p className="mt-3 text-xs text-brand-500">
                Showing the first 8 uploaded benchmark rows here. Use Benchmarking to review the full batch.
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          {(verificationSummary?.links ??
            (dataType === "benchmarks"
              ? [{ href: "/dashboard/benchmarks", label: "Open Benchmarking" }]
              : [{ href: "/dashboard/overview", label: "Open Company Overview" }])
          ).map((link, index) => (
            <Link
              key={`${link.href}-${index}`}
              href={link.href}
              className={clsx(
                "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors",
                index === 0
                  ? "bg-brand-500 text-white hover:bg-brand-600"
                  : "border border-brand-300 text-brand-700 hover:bg-brand-50",
              )}
            >
              {link.label}
              <ExternalLink className="h-4 w-4" />
            </Link>
          ))}
          <button
            onClick={handleDone}
            className="rounded-lg border border-brand-300 px-5 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // Confirm state
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-brand-900">Confirm Import</h2>
        <p className="text-sm text-brand-600 mt-1">
          Review the summary below and confirm to start the import.
        </p>
      </div>

      {/* Import summary */}
      <div className="rounded-xl border border-border bg-white p-6 mb-6">
        <div className="flex items-start gap-4">
          <div
            className={clsx(
              "flex h-12 w-12 items-center justify-center rounded-lg",
              dataType === "employees" && "bg-blue-100 text-blue-600",
              dataType === "benchmarks" && "bg-purple-100 text-purple-600",
              dataType === "compensation" && "bg-green-100 text-green-600"
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-brand-900">
              {dataType === "employees" && "Employee Data Import"}
              {dataType === "benchmarks" && "Salary Benchmarks Import"}
              {dataType === "compensation" && "Compensation Update"}
            </h3>
            <p className="text-sm text-brand-600 mt-1">
              From file: <span className="font-medium">{file?.fileName}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-brand-900">{summary.importing}</p>
            <p className="text-sm text-brand-600">Rows to import</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{summary.excluded}</p>
            <p className="text-sm text-brand-600">Excluded</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{summary.errors}</p>
            <p className="text-sm text-brand-600">With errors</p>
          </div>
        </div>
      </div>

      {/* Warning if replacing data */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {confirmCopy?.title || "Review this import carefully"}
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              {confirmCopy?.body}
            </p>
          </div>
        </div>
      </div>

      {dataType === "employees" && (
        <div className="rounded-xl border border-border bg-white p-4 mb-6">
          <h4 className="text-sm font-semibold text-brand-900 mb-3">Import preview</h4>
          <div className="grid gap-3 md:grid-cols-3 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-brand-500 mb-1">Role distribution</p>
              {roleDistribution.length === 0 ? (
                <p className="text-brand-500">No mapped roles yet</p>
              ) : (
                roleDistribution.map(([value, count]) => (
                  <p key={value} className="text-brand-700">
                    {value}: <span className="font-medium text-brand-900">{count}</span>
                  </p>
                ))
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-brand-500 mb-1">Level distribution</p>
              {levelDistribution.length === 0 ? (
                <p className="text-brand-500">No mapped levels yet</p>
              ) : (
                levelDistribution.map(([value, count]) => (
                  <p key={value} className="text-brand-700">
                    {value}: <span className="font-medium text-brand-900">{count}</span>
                  </p>
                ))
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-brand-500 mb-1">Department breakdown</p>
              {departmentDistribution.length === 0 ? (
                <p className="text-brand-500">No mapped departments yet</p>
              ) : (
                departmentDistribution.map(([value, count]) => (
                  <p key={value} className="text-brand-700">
                    {value}: <span className="font-medium text-brand-900">{count}</span>
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {hasMultiCurrency && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6">
          <p className="text-sm font-medium text-amber-800">
            Multiple currencies detected in this import.
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Confirm that salary values are already normalized per currency before importing.
          </p>
          <label className="mt-3 flex items-center gap-2 text-sm text-amber-800">
            <input
              type="checkbox"
              checked={multiCurrencyConfirmed}
              onChange={(e) => setMultiCurrencyConfirmed(e.target.checked)}
              className="h-4 w-4 rounded border-amber-300 text-brand-500 focus:ring-brand-500"
            />
            I confirm multi-currency values are reviewed and ready to import.
          </label>
        </div>
      )}

      {/* Error message */}
      {importError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Import failed</p>
              <p className="text-sm text-red-600 mt-0.5">{importError}</p>
              {latestResult && latestResult.errors.length > 1 && (
                <ul className="mt-3 space-y-1 text-sm text-red-600">
                  {latestResult.errors.slice(0, 6).map((message, index) => (
                    <li key={`${message}-${index}`}>{message}</li>
                  ))}
                  {latestResult.errors.length > 6 && (
                    <li>{latestResult.errors.length - 6} more issues need review.</li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Import progress */}
      {isImporting && (
        <div className="rounded-lg bg-brand-50 border border-brand-200 p-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <span className="text-sm font-medium text-brand-900">
              Importing data... {importProgress}%
            </span>
          </div>
          <div className="h-2 w-full bg-brand-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-300"
              style={{ width: `${importProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => store.prevStep()}
          disabled={isImporting}
          className="rounded-lg border border-brand-300 px-5 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleImport}
          disabled={isImporting || summary.importing === 0 || (hasMultiCurrency && !multiCurrencyConfirmed)}
          className={clsx(
            "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all",
            !isImporting && summary.importing > 0
              ? "bg-brand-500 text-white hover:bg-brand-600"
              : "bg-brand-100 text-brand-400 cursor-not-allowed"
          )}
        >
          {isImporting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Import {summary.importing} Records
            </>
          )}
        </button>
      </div>
    </div>
  );
}
