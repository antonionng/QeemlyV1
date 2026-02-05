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
  getImportSummary,
  getRowsToImport,
  uploadEmployees,
  uploadBenchmarks,
  createUploadRecord,
  transformEmployee,
  transformBenchmark,
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
    setImporting,
    setImportProgress,
    setImportError,
    setImportedCount,
    goToStep,
    reset,
  } = store;

  const isSuccess = currentStep === "success";
  const summary = getImportSummary(store);

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
          .filter(Boolean) as any[];

        result = await uploadEmployees(employees, setImportProgress);
      } else if (dataType === "benchmarks") {
        const benchmarks = rowsToImport
          .map((row) => transformBenchmark(row.data))
          .filter(Boolean) as any[];

        result = await uploadBenchmarks(benchmarks, setImportProgress);
      } else {
        // Compensation updates - similar flow
        result = { success: true, insertedCount: 0, errors: [] };
      }

      // Create audit record
      await createUploadRecord({
        uploadType: dataType,
        fileName: file.fileName,
        fileSize: file.fileSize,
        rowCount: summary.total,
        successCount: result.insertedCount,
        errorCount: result.errors.length,
        errors: result.errors,
      });

      if (result.success) {
        setImportedCount(result.insertedCount);
        goToStep("success");
        onSuccess?.();
      } else {
        setImportError(result.errors.join(", ") || "Import failed");
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
          Successfully imported{" "}
          <span className="font-semibold text-brand-900">{importedCount}</span>{" "}
          {dataType === "employees" && "employees"}
          {dataType === "benchmarks" && "benchmark records"}
          {dataType === "compensation" && "compensation updates"}
        </p>

        <div className="flex items-center gap-3">
          {dataType === "employees" && (
            <Link
              href="/dashboard/overview"
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
            >
              View Employees
              <ExternalLink className="h-4 w-4" />
            </Link>
          )}
          {dataType === "benchmarks" && (
            <Link
              href="/dashboard/benchmarks"
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
            >
              View Benchmarks
              <ExternalLink className="h-4 w-4" />
            </Link>
          )}
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
              This will add new records to your database
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              {dataType === "employees" &&
                "New employees will be created. Existing records will not be modified."}
              {dataType === "benchmarks" &&
                "Benchmarks with matching role/location/level will be updated. New ones will be created."}
              {dataType === "compensation" &&
                "Employee salaries will be updated based on email matching."}
            </p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {importError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Import failed</p>
              <p className="text-sm text-red-600 mt-0.5">{importError}</p>
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
          disabled={isImporting || summary.importing === 0}
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
