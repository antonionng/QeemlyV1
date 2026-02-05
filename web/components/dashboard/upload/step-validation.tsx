"use client";

import { useMemo, useState } from "react";
import {
  Check,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Filter,
  Download,
} from "lucide-react";
import clsx from "clsx";
import { useUploadStore, getIssueSummary } from "@/lib/upload";

type FilterType = "all" | "valid" | "warning" | "error";

export function StepValidation() {
  const {
    validationResult,
    excludedRows,
    toggleRowExclusion,
    excludeAllErrors,
    nextStep,
  } = useUploadStore();
  const [filter, setFilter] = useState<FilterType>("all");
  const [showDetails, setShowDetails] = useState<number | null>(null);

  const filteredRows = useMemo(() => {
    if (!validationResult) return [];

    return validationResult.rows.filter((row) => {
      if (filter === "all") return true;
      if (filter === "valid") return row.isValid && !row.hasWarnings;
      if (filter === "warning") return row.isValid && row.hasWarnings;
      if (filter === "error") return !row.isValid;
      return true;
    });
  }, [validationResult, filter]);

  const issueSummary = useMemo(() => {
    if (!validationResult) return new Map();
    return getIssueSummary(validationResult.issues);
  }, [validationResult]);

  if (!validationResult) return null;

  const { totalRows, validRows, warningRows, errorRows } = validationResult;
  const excludedCount = excludedRows.size;
  const importableCount = validRows + warningRows - excludedCount;

  const handleContinue = () => {
    nextStep();
  };

  const handleDownloadErrors = () => {
    const errorData = validationResult.rows
      .filter((r) => !r.isValid || r.hasWarnings)
      .map((row) => ({
        row: row.rowIndex,
        issues: row.issues.map((i) => `${i.field}: ${i.message}`).join("; "),
      }));

    const csv = [
      "Row,Issues",
      ...errorData.map((e) => `${e.row},"${e.issues}"`),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "validation-errors.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-brand-900">Review your data</h2>
        <p className="text-sm text-brand-600 mt-1">
          We&apos;ve validated your data. Review any issues before importing.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-2xl font-bold text-brand-900">{totalRows}</p>
          <p className="text-sm text-brand-600">Total rows</p>
        </div>
        <button
          onClick={() => setFilter("valid")}
          className={clsx(
            "rounded-lg border p-4 text-left transition-all",
            filter === "valid"
              ? "border-green-500 bg-green-50"
              : "border-border bg-white hover:border-green-300"
          )}
        >
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            <p className="text-2xl font-bold text-green-700">{validRows}</p>
          </div>
          <p className="text-sm text-green-600">Ready to import</p>
        </button>
        <button
          onClick={() => setFilter("warning")}
          className={clsx(
            "rounded-lg border p-4 text-left transition-all",
            filter === "warning"
              ? "border-amber-500 bg-amber-50"
              : "border-border bg-white hover:border-amber-300"
          )}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <p className="text-2xl font-bold text-amber-700">{warningRows}</p>
          </div>
          <p className="text-sm text-amber-600">With warnings</p>
        </button>
        <button
          onClick={() => setFilter("error")}
          className={clsx(
            "rounded-lg border p-4 text-left transition-all",
            filter === "error"
              ? "border-red-500 bg-red-50"
              : "border-border bg-white hover:border-red-300"
          )}
        >
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <p className="text-2xl font-bold text-red-700">{errorRows}</p>
          </div>
          <p className="text-sm text-red-600">Has errors</p>
        </button>
      </div>

      {/* Issue summary */}
      {issueSummary.size > 0 && (
        <div className="mb-6 rounded-lg border border-border bg-brand-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-brand-900">Common issues</h3>
            <div className="flex items-center gap-2">
              {errorRows > 0 && (
                <button
                  onClick={excludeAllErrors}
                  className="text-xs font-medium text-brand-600 hover:text-brand-800"
                >
                  Exclude all errors
                </button>
              )}
              <button
                onClick={handleDownloadErrors}
                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-800"
              >
                <Download className="h-3 w-3" />
                Download report
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            {Array.from(issueSummary.entries())
              .slice(0, 5)
              .map(([issue, count]) => (
                <div
                  key={issue}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-brand-700">{issue}</span>
                  <span className="font-medium text-brand-900">{count} rows</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-brand-500" />
        <div className="flex gap-1">
          {(["all", "valid", "warning", "error"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                filter === f
                  ? "bg-brand-500 text-white"
                  : "bg-brand-100 text-brand-700 hover:bg-brand-200"
              )}
            >
              {f === "all" && "All"}
              {f === "valid" && "Valid"}
              {f === "warning" && "Warnings"}
              {f === "error" && "Errors"}
            </button>
          ))}
        </div>
        <span className="text-sm text-brand-600 ml-auto">
          Showing {filteredRows.length} of {totalRows} rows
        </span>
      </div>

      {/* Data table */}
      <div className="rounded-xl border border-border overflow-hidden max-h-[400px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-brand-700 w-12">
                Row
              </th>
              <th className="px-4 py-3 text-left font-medium text-brand-700">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium text-brand-700">
                Issues
              </th>
              <th className="px-4 py-3 text-center font-medium text-brand-700 w-24">
                Include
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredRows.slice(0, 100).map((row) => {
              const isExcluded = excludedRows.has(row.rowIndex);
              const hasIssues = row.issues.length > 0;

              return (
                <tr
                  key={row.rowIndex}
                  className={clsx(
                    "hover:bg-brand-50 transition-colors",
                    isExcluded && "opacity-50 bg-brand-50"
                  )}
                >
                  <td className="px-4 py-3 font-mono text-brand-600">
                    {row.rowIndex}
                  </td>
                  <td className="px-4 py-3">
                    {row.isValid && !row.hasWarnings && (
                      <span className="inline-flex items-center gap-1 text-green-700">
                        <Check className="h-4 w-4" />
                        Valid
                      </span>
                    )}
                    {row.isValid && row.hasWarnings && (
                      <span className="inline-flex items-center gap-1 text-amber-700">
                        <AlertTriangle className="h-4 w-4" />
                        Warning
                      </span>
                    )}
                    {!row.isValid && (
                      <span className="inline-flex items-center gap-1 text-red-700">
                        <XCircle className="h-4 w-4" />
                        Error
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {hasIssues ? (
                      <div className="space-y-1">
                        {row.issues.slice(0, 2).map((issue, i) => (
                          <div key={i} className="text-xs text-brand-700">
                            <span className="font-medium">{issue.field}:</span>{" "}
                            {issue.message}
                          </div>
                        ))}
                        {row.issues.length > 2 && (
                          <button
                            onClick={() =>
                              setShowDetails(
                                showDetails === row.rowIndex ? null : row.rowIndex
                              )
                            }
                            className="text-xs text-brand-500 hover:text-brand-700"
                          >
                            {showDetails === row.rowIndex
                              ? "Show less"
                              : `+${row.issues.length - 2} more`}
                          </button>
                        )}
                        {showDetails === row.rowIndex &&
                          row.issues.slice(2).map((issue, i) => (
                            <div key={i + 2} className="text-xs text-brand-700">
                              <span className="font-medium">{issue.field}:</span>{" "}
                              {issue.message}
                            </div>
                          ))}
                      </div>
                    ) : (
                      <span className="text-xs text-brand-400">No issues</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={!isExcluded && row.isValid}
                      disabled={!row.isValid}
                      onChange={() => row.isValid && toggleRowExclusion(row.rowIndex)}
                      className="h-4 w-4 rounded border-brand-300 text-brand-500 focus:ring-brand-500 disabled:opacity-50"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredRows.length > 100 && (
          <div className="px-4 py-3 bg-brand-50 text-center text-sm text-brand-600">
            Showing first 100 rows. {filteredRows.length - 100} more rows not displayed.
          </div>
        )}
      </div>

      {/* Continue button */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-brand-600">
          <span className="font-medium text-brand-900">{importableCount}</span>{" "}
          rows will be imported
          {excludedCount > 0 && (
            <span className="text-brand-500 ml-1">
              ({excludedCount} excluded)
            </span>
          )}
        </div>

        <button
          onClick={handleContinue}
          disabled={importableCount === 0}
          className={clsx(
            "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all",
            importableCount > 0
              ? "bg-brand-500 text-white hover:bg-brand-600"
              : "bg-brand-100 text-brand-400 cursor-not-allowed"
          )}
        >
          Continue to Import
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
