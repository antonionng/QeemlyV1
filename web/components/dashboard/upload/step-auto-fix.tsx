"use client";

import { ArrowRight, Wand2 } from "lucide-react";
import clsx from "clsx";
import { useMemo } from "react";
import { useUploadStore } from "@/lib/upload";

export function StepAutoFix() {
  const { validationResult, nextStep } = useUploadStore();

  const summary = useMemo(() => {
    if (!validationResult) {
      return {
        fixableCount: 0,
        examples: [],
      };
    }
    const examples = validationResult.issues
      .filter((issue) => issue.severity === "warning")
      .slice(0, 5)
      .map((issue) => `${issue.field}: ${issue.message}`);
    return {
      fixableCount: validationResult.warningRows,
      examples,
    };
  }, [validationResult]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-brand-900">Auto-fix suggestions</h2>
        <p className="text-sm text-brand-600 mt-1">
          Qeemly has normalized formats where possible. Review suggested fixes before final error review and import.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100">
            <Wand2 className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-900">
              {summary.fixableCount} rows include warnings with suggested fixes
            </p>
            <p className="text-xs text-brand-600">
              Numbers, enum casing, and date formats are auto-normalized when safe.
            </p>
          </div>
        </div>

        {summary.examples.length > 0 && (
          <div className="mt-4 rounded-lg bg-brand-50 p-3">
            <p className="text-xs uppercase tracking-wide text-brand-500 mb-2">Examples</p>
            <div className="space-y-1">
              {summary.examples.map((example) => (
                <p key={example} className="text-xs text-brand-700">
                  {example}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={nextStep}
          className={clsx(
            "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all",
            "bg-brand-500 text-white hover:bg-brand-600",
          )}
        >
          Continue to Error Review
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
