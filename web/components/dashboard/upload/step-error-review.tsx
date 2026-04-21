"use client";

import { useMemo } from "react";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { useUploadStore } from "@/lib/upload";
import { Button } from "@/components/ui/button";

export function StepErrorReview() {
  const {
    validationResult,
    excludedRows,
    setExcludedRows,
    nextStep,
  } = useUploadStore();

  const reviewStats = useMemo(() => {
    if (!validationResult) {
      return {
        duplicateRows: [] as number[],
        warningRows: [] as number[],
      };
    }
    const duplicateRows = validationResult.rows
      .filter((row) =>
        row.issues.some((issue) => issue.message === "Possible duplicate row detected"),
      )
      .map((row) => row.rowIndex);
    const warningRows = validationResult.rows
      .filter((row) => row.isValid && row.hasWarnings)
      .map((row) => row.rowIndex);
    return { duplicateRows, warningRows };
  }, [validationResult]);

  if (!validationResult) {
    return (
      <div className="p-6">
        <p className="text-sm text-brand-600">No validation result available yet.</p>
      </div>
    );
  }

  const applyDuplicateExclusion = () => {
    const merged = new Set([...Array.from(excludedRows), ...reviewStats.duplicateRows]);
    setExcludedRows(merged);
  };

  const applyWarningExclusion = () => {
    const merged = new Set([...Array.from(excludedRows), ...reviewStats.warningRows]);
    setExcludedRows(merged);
  };

  const resetExclusions = () => setExcludedRows(new Set<number>());

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-brand-900">Error review</h2>
        <p className="text-sm text-brand-600 mt-1">
          Apply bulk review actions before import. You can still edit row inclusion in the previous step.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs uppercase tracking-wide text-brand-500">Duplicate warnings</p>
            <p className="text-xl font-semibold text-brand-900">{reviewStats.duplicateRows.length}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs uppercase tracking-wide text-brand-500">Rows with warnings</p>
            <p className="text-xl font-semibold text-brand-900">{reviewStats.warningRows.length}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs uppercase tracking-wide text-brand-500">Currently excluded</p>
            <p className="text-xl font-semibold text-brand-900">{excludedRows.size}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={applyDuplicateExclusion}
            className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-50"
          >
            Exclude duplicate rows
          </button>
          <button
            type="button"
            onClick={applyWarningExclusion}
            className="rounded-lg border border-brand-300 px-3 py-2 text-xs font-medium text-brand-700 hover:bg-brand-50"
          >
            Exclude all warning rows
          </button>
          <button
            type="button"
            onClick={resetExclusions}
            className="rounded-lg border border-brand-200 px-3 py-2 text-xs font-medium text-brand-600 hover:bg-brand-50"
          >
            Reset exclusions
          </button>
        </div>

        {reviewStats.duplicateRows.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Duplicate rows detected</span>
            </div>
            <p>Rows: {reviewStats.duplicateRows.slice(0, 10).join(", ")}</p>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="primary" size="sm" onClick={nextStep}>
          Continue to Import
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
