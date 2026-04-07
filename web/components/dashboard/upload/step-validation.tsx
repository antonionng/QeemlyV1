"use client";

import { Fragment, useMemo, useState } from "react";
import {
  Check,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Filter,
  Download,
} from "lucide-react";
import clsx from "clsx";
import { getValidationLegend, useUploadStore, getIssueSummary } from "@/lib/upload";

type FilterType = "all" | "valid" | "warning" | "error";
type ResolveMode = "total" | "allowances";
type AllowanceType = "transport" | "accommodation" | "housing" | "meal" | "phone" | "custom";
type AllowanceLine = {
  id: string;
  type: AllowanceType;
  customType: string;
  amount: string;
};

const BASE_ONLY_SALARY_MESSAGE =
  "Base salary only is not allowed. Provide total salary or include allowances.";

function parseMaybeNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

const ALLOWANCE_TYPE_OPTIONS: Array<{ value: AllowanceType; label: string }> = [
  { value: "transport", label: "Transport" },
  { value: "accommodation", label: "Accommodation" },
  { value: "housing", label: "Housing" },
  { value: "meal", label: "Meal" },
  { value: "phone", label: "Phone" },
  { value: "custom", label: "Custom" },
];

function createAllowanceLine(overrides?: Partial<AllowanceLine>): AllowanceLine {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: "transport",
    customType: "",
    amount: "",
    ...overrides,
  };
}

function typeLabelForStorage(line: AllowanceLine): string {
  if (line.type === "custom") return line.customType.trim().toLowerCase();
  return line.type;
}

function sumAllowanceLines(lines: AllowanceLine[]): number {
  return lines.reduce((acc, line) => {
    const parsed = parseMaybeNumber(line.amount);
    return acc + (parsed ?? 0);
  }, 0);
}

function splitAllowanceLines(lines: AllowanceLine[]): {
  transportTotal: number;
  accommodationTotal: number;
  customTotal: number;
  customLines: Array<{ type: string; amount: number }>;
} {
  let transportTotal = 0;
  let accommodationTotal = 0;
  let customTotal = 0;
  const customLines: Array<{ type: string; amount: number }> = [];

  for (const line of lines) {
    const amount = parseMaybeNumber(line.amount);
    if (amount === null || amount <= 0) continue;
    const type = typeLabelForStorage(line);

    if (type.includes("transport") || type.includes("commute") || type.includes("travel")) {
      transportTotal += amount;
      continue;
    }
    if (
      type.includes("accommodation") ||
      type.includes("housing") ||
      type.includes("rent") ||
      type.includes("lodging")
    ) {
      accommodationTotal += amount;
      continue;
    }

    customTotal += amount;
    customLines.push({ type: type || "custom", amount });
  }

  return { transportTotal, accommodationTotal, customTotal, customLines };
}

export function StepValidation() {
  const {
    dataType,
    validationResult,
    setValidationResult,
    excludedRows,
    toggleRowExclusion,
    excludeAllErrors,
    nextStep,
  } = useUploadStore();
  const [filter, setFilter] = useState<FilterType>("all");
  const [showDetails, setShowDetails] = useState<number | null>(null);
  const [selectedSalaryRows, setSelectedSalaryRows] = useState<Set<number>>(new Set());
  const [activeResolveRow, setActiveResolveRow] = useState<number | null>(null);
  const [resolveMode, setResolveMode] = useState<ResolveMode>("total");
  const [rowTotalSalary, setRowTotalSalary] = useState("");
  const [rowAllowanceLines, setRowAllowanceLines] = useState<AllowanceLine[]>([
    createAllowanceLine({ type: "transport" }),
  ]);
  const [bulkTotalSalary, setBulkTotalSalary] = useState("");
  const [bulkResolveMode, setBulkResolveMode] = useState<ResolveMode>("total");
  const [bulkAllowanceLines, setBulkAllowanceLines] = useState<AllowanceLine[]>([
    createAllowanceLine({ type: "transport" }),
  ]);

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

  const legend = getValidationLegend(dataType ?? "employees");

  if (!validationResult) return null;

  const { totalRows, validRows, warningRows, errorRows } = validationResult;
  const excludedCount = excludedRows.size;
  const importableCount = validRows + warningRows - excludedCount;

  const handleContinue = () => {
    nextStep();
  };

  const isBaseOnlySalaryRow = (row: (typeof validationResult.rows)[number]) =>
    row.issues.some(
      (issue) => issue.field === "baseSalary" && issue.message === BASE_ONLY_SALARY_MESSAGE,
    );

  const salaryErrorRows = validationResult.rows.filter((row) => isBaseOnlySalaryRow(row));

  const rebuildValidationSummary = (rows: typeof validationResult.rows) => {
    const issues = rows.flatMap((row) => row.issues);
    return {
      ...validationResult,
      rows,
      issues,
      validRows: rows.filter((row) => row.isValid && !row.hasWarnings).length,
      warningRows: rows.filter((row) => row.isValid && row.hasWarnings).length,
      errorRows: rows.filter((row) => !row.isValid).length,
      meta: {
        ...(validationResult.meta || {}),
        duplicateRows:
          validationResult.meta?.duplicateRows ??
          rows.filter((row) =>
            row.issues.some((issue) => issue.message === "Possible duplicate row detected"),
          ).length,
        currencies: validationResult.meta?.currencies ?? [],
      },
    };
  };

  const applyResolutionToRows = (
    targetRows: number[],
    strategy: ResolveMode,
    values: {
      totalSalary?: string;
      allowanceLines?: AllowanceLine[];
    },
  ) => {
    if (targetRows.length === 0) return;

    const parsedTotal = values.totalSalary ? parseMaybeNumber(values.totalSalary) : null;
    const allowanceSplit = values.allowanceLines
      ? splitAllowanceLines(values.allowanceLines)
      : null;
    const allowanceTotal =
      (allowanceSplit?.transportTotal ?? 0) +
      (allowanceSplit?.accommodationTotal ?? 0) +
      (allowanceSplit?.customTotal ?? 0);
    const resolvedRows = new Set<number>();

    const updatedRows = validationResult.rows.map((row) => {
      if (!targetRows.includes(row.rowIndex) || !isBaseOnlySalaryRow(row)) return row;

      const nextData = { ...row.data };
      let rowResolved = false;
      if (strategy === "total") {
        if (parsedTotal !== null) {
          nextData.totalSalary = parsedTotal;
          delete nextData.baseSalary;
          rowResolved = true;
        }
      } else {
        if (allowanceSplit && allowanceTotal > 0) {
          if (allowanceSplit.transportTotal > 0) {
            nextData.transportAllowance = allowanceSplit.transportTotal;
          }
          if (allowanceSplit.accommodationTotal > 0) {
            nextData.accommodationAllowance = allowanceSplit.accommodationTotal;
          }

          const baseSalary =
            typeof nextData.baseSalary === "number"
              ? nextData.baseSalary
              : parseMaybeNumber(String(nextData.baseSalary ?? ""));
          if (baseSalary !== null) {
            nextData.totalSalary = baseSalary + allowanceTotal;
          }
          nextData.customAllowances = allowanceSplit.customLines;
          rowResolved = true;
        }
      }

      const nextIssues = rowResolved
        ? row.issues.filter(
            (issue) => !(issue.field === "baseSalary" && issue.message === BASE_ONLY_SALARY_MESSAGE),
          )
        : row.issues;

      if (rowResolved) {
        resolvedRows.add(row.rowIndex);
      }

      return {
        ...row,
        data: nextData,
        issues: nextIssues,
        isValid: !nextIssues.some((issue) => issue.severity === "error"),
        hasWarnings: nextIssues.some((issue) => issue.severity === "warning"),
      };
    });

    setValidationResult(rebuildValidationSummary(updatedRows));
    setSelectedSalaryRows((prev) => {
      const next = new Set(prev);
      for (const rowIndex of resolvedRows) next.delete(rowIndex);
      return next;
    });
  };

  const toggleSalaryRowSelection = (rowIndex: number) => {
    setSelectedSalaryRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) next.delete(rowIndex);
      else next.add(rowIndex);
      return next;
    });
  };

  const openResolveEditor = (rowIndex: number) => {
    const row = validationResult.rows.find((item) => item.rowIndex === rowIndex);
    const seededLines: AllowanceLine[] = [];
    if (row?.data.transportAllowance) {
      seededLines.push(
        createAllowanceLine({
          type: "transport",
          amount: String(row.data.transportAllowance),
        }),
      );
    }
    if (row?.data.accommodationAllowance) {
      seededLines.push(
        createAllowanceLine({
          type: "accommodation",
          amount: String(row.data.accommodationAllowance),
        }),
      );
    }
    if (seededLines.length === 0) {
      seededLines.push(createAllowanceLine({ type: "transport" }));
    }

    setActiveResolveRow(rowIndex);
    setResolveMode("total");
    setRowTotalSalary(row?.data.totalSalary ? String(row.data.totalSalary) : "");
    setRowAllowanceLines(seededLines);
  };

  const handleDownloadErrors = () => {
    const getSuggestedFix = (field: string, message: string, value: unknown): string => {
      const displayValue = value == null ? "" : String(value);
      if (field === "status") return "Use active or inactive.";
      if (field === "employmentType") return "Use national or expat.";
      if (field === "performanceRating") return "Use low, meets, exceeds, or exceptional.";
      if (field === "visaStatus") return "Use active, expiring, expired, pending, or cancelled.";
      if (field === "salary" || field === "baseSalary" || field === "totalSalary") {
        return "Provide total salary, or provide base plus allowances. Avoid base only.";
      }
      if (message.toLowerCase().includes("date")) return "Convert to YYYY-MM-DD.";
      if (message.toLowerCase().includes("email")) return "Provide a valid email format.";
      if (message.toLowerCase().includes("number")) return "Remove commas and currency symbols from numeric values.";
      if (displayValue.length > 0) return `Review value "${displayValue}" and map it to a supported option.`;
      return "Review this field and provide a supported value.";
    };

    const csvLines = ["Row,OriginalRow,Error,SuggestedFix"];
    for (const row of validationResult.rows.filter((r) => !r.isValid || r.hasWarnings)) {
      const originalRow = JSON.stringify(row.data).replace(/"/g, '""');
      for (const issue of row.issues) {
        const errorText = `${issue.field}: ${issue.message}`.replace(/"/g, '""');
        const suggestedFix = getSuggestedFix(issue.field, issue.message, issue.value).replace(/"/g, '""');
        csvLines.push(
          `${row.rowIndex},"${originalRow}","${errorText}","${suggestedFix}"`,
        );
      }
    }

    const csv = csvLines.join("\n");

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
          We&apos;ve validated your data. Review what is ready, what needs attention, and what will be skipped before importing.
        </p>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {legend.map((item) => (
          <div key={item.id} className="rounded-lg border border-border bg-white p-3">
            <p className="text-sm font-semibold text-brand-900">{item.label}</p>
            <p className="mt-1 text-xs text-brand-600">{item.description}</p>
          </div>
        ))}
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

      {salaryErrorRows.length > 0 && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            Resolve base-only salary rows before import
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Choose per-record fixes, or apply a bulk action for selected rows or all salary-error rows.
          </p>
          <div className="mt-4 rounded-xl border border-amber-200/90 bg-white/80 p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
              <div className="min-w-0 flex-1 space-y-3">
                <p className="text-xs font-medium text-amber-900">Bulk fix</p>
                <div
                  className="inline-flex w-full max-w-md rounded-lg border border-amber-200 bg-amber-50/80 p-0.5 sm:w-auto"
                  role="group"
                  aria-label="Bulk fix type"
                >
                  <button
                    type="button"
                    onClick={() => setBulkResolveMode("total")}
                    className={clsx(
                      "flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors sm:flex-none sm:px-4",
                      bulkResolveMode === "total"
                        ? "bg-white text-amber-950 shadow-sm"
                        : "text-amber-800 hover:bg-white/60",
                    )}
                  >
                    Set total salary
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkResolveMode("allowances")}
                    className={clsx(
                      "flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors sm:flex-none sm:px-4",
                      bulkResolveMode === "allowances"
                        ? "bg-white text-amber-950 shadow-sm"
                        : "text-amber-800 hover:bg-white/60",
                    )}
                  >
                    Add allowances
                  </button>
                </div>

                {bulkResolveMode === "total" ? (
                  <div className="space-y-2">
                    <label className="block text-xs text-amber-800" htmlFor="bulk-total-salary">
                      Same total for every target row
                    </label>
                    <input
                      id="bulk-total-salary"
                      value={bulkTotalSalary}
                      onChange={(e) => setBulkTotalSalary(e.target.value)}
                      placeholder="e.g. 180000"
                      className="w-full max-w-md rounded-lg border border-amber-300 bg-white px-4 py-3 text-base text-brand-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-11"
                    />
                    <p className="max-w-md text-xs text-amber-700">
                      Use checkboxes in the table to choose rows, or apply to every salary-error row on the right.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-amber-800">
                      Build allowances line by line
                    </p>
                    {bulkAllowanceLines.map((line) => (
                      <div
                        key={line.id}
                        className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3"
                      >
                        <select
                          value={line.type}
                          onChange={(e) =>
                            setBulkAllowanceLines((prev) =>
                              prev.map((item) =>
                                item.id === line.id
                                  ? { ...item, type: e.target.value as AllowanceType }
                                  : item,
                              ),
                            )
                          }
                          className="min-h-11 w-full min-w-0 flex-1 rounded-lg border border-amber-300 px-4 py-3 text-base text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 sm:min-w-[200px]"
                        >
                          {ALLOWANCE_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {line.type === "custom" ? (
                          <input
                            value={line.customType}
                            onChange={(e) =>
                              setBulkAllowanceLines((prev) =>
                                prev.map((item) =>
                                  item.id === line.id
                                    ? { ...item, customType: e.target.value }
                                    : item,
                                ),
                              )
                            }
                            placeholder="Custom type (example: schooling)"
                            className="min-h-11 w-full min-w-0 flex-1 rounded-lg border border-amber-300 px-4 py-3 text-base text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 sm:max-w-xs"
                          />
                        ) : null}
                        <div className="flex min-h-11 min-w-0 flex-1 gap-2 sm:max-w-[min(100%,22rem)]">
                          <input
                            value={line.amount}
                            onChange={(e) =>
                              setBulkAllowanceLines((prev) =>
                                prev.map((item) =>
                                  item.id === line.id ? { ...item, amount: e.target.value } : item,
                                ),
                              )
                            }
                            placeholder="Amount"
                            className="min-w-0 flex-1 rounded-lg border border-amber-300 px-4 py-3 text-base text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                          {bulkAllowanceLines.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setBulkAllowanceLines((prev) =>
                                  prev.filter((item) => item.id !== line.id),
                                )
                              }
                              className="shrink-0 rounded-lg border border-amber-300 px-3 py-2 text-sm text-amber-800 hover:bg-amber-100"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setBulkAllowanceLines((prev) => [...prev, createAllowanceLine()])
                      }
                      className="rounded-lg border border-amber-300 px-4 py-3 text-sm font-medium text-amber-800 hover:bg-amber-100 min-h-11"
                    >
                      Add another type
                    </button>
                  </div>
                )}
              </div>

              <div className="flex w-full shrink-0 flex-col gap-3 border-t border-amber-200/80 pt-4 lg:w-56 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <p className="text-xs leading-relaxed text-amber-800">
                  <span className="font-semibold text-amber-950">{selectedSalaryRows.size}</span>{" "}
                  selected
                  <span className="text-amber-600"> · </span>
                  <span className="font-semibold text-amber-950">{salaryErrorRows.length}</span>{" "}
                  salary-error rows
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      applyResolutionToRows(
                        Array.from(selectedSalaryRows),
                        bulkResolveMode,
                        bulkResolveMode === "total"
                          ? { totalSalary: bulkTotalSalary }
                          : { allowanceLines: bulkAllowanceLines },
                      )
                    }
                    className="rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-xs font-medium text-amber-900 shadow-sm hover:bg-amber-50"
                  >
                    Apply to selected
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyResolutionToRows(
                        salaryErrorRows.map((row) => row.rowIndex),
                        bulkResolveMode,
                        bulkResolveMode === "total"
                          ? { totalSalary: bulkTotalSalary }
                          : { allowanceLines: bulkAllowanceLines },
                      )
                    }
                    className="rounded-lg border border-brand-400/60 bg-brand-500 px-3 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-brand-600"
                  >
                    Apply to all salary-error rows
                  </button>
                </div>
              </div>
            </div>
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
              <th className="px-4 py-3 text-center font-medium text-brand-700 w-40">
                Action
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
                <Fragment key={row.rowIndex}>
                  <tr
                    className={clsx(
                      "hover:bg-brand-50 transition-colors",
                      isExcluded && "opacity-50 bg-brand-50"
                    )}
                  >
                    <td className="px-4 py-3 text-brand-600">
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
                      {isBaseOnlySalaryRow(row) ? (
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedSalaryRows.has(row.rowIndex)}
                            onChange={() => toggleSalaryRowSelection(row.rowIndex)}
                            className="h-4 w-4 rounded border-brand-300 text-brand-500 focus:ring-brand-500"
                          />
                          <button
                            onClick={() => openResolveEditor(row.rowIndex)}
                            className="rounded-lg border border-brand-300 px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                          >
                            Resolve
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-brand-400">-</span>
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
                  {activeResolveRow === row.rowIndex && isBaseOnlySalaryRow(row) && (
                    <tr className="bg-brand-50">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="space-y-3">
                          <select
                            value={resolveMode}
                            onChange={(e) => setResolveMode(e.target.value as ResolveMode)}
                            className="w-full max-w-md rounded-lg border border-brand-200 px-4 py-3 text-base text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-11"
                          >
                            <option value="total">Set total salary directly</option>
                            <option value="allowances">Build total from base + allowances</option>
                          </select>
                          {resolveMode === "total" ? (
                            <input
                              value={rowTotalSalary}
                              onChange={(e) => setRowTotalSalary(e.target.value)}
                              placeholder="Total salary"
                              className="w-full max-w-md rounded-lg border border-brand-200 px-4 py-3 text-base text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-11"
                            />
                          ) : (
                            <div className="space-y-2 rounded-lg border border-brand-200 bg-white p-3">
                              <p className="text-xs font-medium text-brand-700">
                                Add allowances line by line
                              </p>
                              {rowAllowanceLines.map((line) => (
                                <div
                                  key={line.id}
                                  className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3"
                                >
                                  <select
                                    value={line.type}
                                    onChange={(e) =>
                                      setRowAllowanceLines((prev) =>
                                        prev.map((item) =>
                                          item.id === line.id
                                            ? { ...item, type: e.target.value as AllowanceType }
                                            : item,
                                        ),
                                      )
                                    }
                                    className="min-h-11 w-full min-w-0 flex-1 rounded-lg border border-brand-200 px-4 py-3 text-base text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 sm:min-w-[200px]"
                                  >
                                    {ALLOWANCE_TYPE_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                  {line.type === "custom" ? (
                                    <input
                                      value={line.customType}
                                      onChange={(e) =>
                                        setRowAllowanceLines((prev) =>
                                          prev.map((item) =>
                                            item.id === line.id
                                              ? { ...item, customType: e.target.value }
                                              : item,
                                          ),
                                        )
                                      }
                                      placeholder="Custom type (example: schooling)"
                                      className="min-h-11 w-full min-w-0 flex-1 rounded-lg border border-brand-200 px-4 py-3 text-base text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 sm:max-w-xs"
                                    />
                                  ) : null}
                                  <div className="flex min-h-11 min-w-0 flex-1 gap-2 sm:max-w-[min(100%,22rem)]">
                                    <input
                                      value={line.amount}
                                      onChange={(e) =>
                                        setRowAllowanceLines((prev) =>
                                          prev.map((item) =>
                                            item.id === line.id
                                              ? { ...item, amount: e.target.value }
                                              : item,
                                          ),
                                        )
                                      }
                                      placeholder="Amount"
                                      className="min-w-0 flex-1 rounded-lg border border-brand-200 px-4 py-3 text-base text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                    {rowAllowanceLines.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setRowAllowanceLines((prev) =>
                                            prev.filter((item) => item.id !== line.id),
                                          )
                                        }
                                        className="shrink-0 rounded-lg border border-brand-300 px-3 py-2 text-sm text-brand-700 hover:bg-brand-100"
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() =>
                                  setRowAllowanceLines((prev) => [
                                    ...prev,
                                    createAllowanceLine(),
                                  ])
                                }
                                className="rounded-lg border border-brand-300 px-4 py-3 text-sm font-medium text-brand-700 hover:bg-brand-100 min-h-11"
                              >
                                Add another type
                              </button>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                applyResolutionToRows(
                                  [row.rowIndex],
                                  resolveMode,
                                  resolveMode === "total"
                                    ? { totalSalary: rowTotalSalary }
                                    : { allowanceLines: rowAllowanceLines },
                                );
                                setActiveResolveRow(null);
                              }}
                              className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-medium text-white hover:bg-brand-600"
                            >
                              Apply
                            </button>
                            <button
                              onClick={() => setActiveResolveRow(null)}
                              className="rounded-lg border border-brand-300 px-4 py-2 text-xs font-medium text-brand-700 hover:bg-brand-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                        {resolveMode === "allowances" && (
                          <p className="mt-2 text-xs text-brand-600">
                            Allowance total: {sumAllowanceLines(rowAllowanceLines).toLocaleString()}
                            {typeof row.data.baseSalary === "number" &&
                              ` | Base + allowances: ${(row.data.baseSalary + sumAllowanceLines(rowAllowanceLines)).toLocaleString()}`}
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
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
          Continue to Auto-fix
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
