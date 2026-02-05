"use client";

import { useMemo } from "react";
import { ArrowRight, AlertCircle, Check, HelpCircle } from "lucide-react";
import clsx from "clsx";
import {
  useUploadStore,
  getFieldsForType,
  getMissingRequiredFields,
  getUnmappedFields,
  validateData,
  type FieldDefinition,
} from "@/lib/upload";

export function StepColumnMapping() {
  const {
    dataType,
    file,
    mappings,
    updateMapping,
    setValidationResult,
    nextStep,
  } = useUploadStore();

  const fields = useMemo(
    () => (dataType ? getFieldsForType(dataType) : []),
    [dataType]
  );

  const missingRequired = useMemo(
    () => (dataType ? getMissingRequiredFields(mappings, dataType) : []),
    [mappings, dataType]
  );

  const unmappedFields = useMemo(
    () => (dataType ? getUnmappedFields(mappings, dataType) : []),
    [mappings, dataType]
  );

  const handleMappingChange = (sourceIndex: number, targetField: string) => {
    // If "none" selected, set to null
    updateMapping(sourceIndex, targetField === "" ? null : targetField);
  };

  const handleContinue = () => {
    if (!file || !dataType || missingRequired.length > 0) return;

    // Run validation
    const result = validateData(file.rows, mappings, dataType);
    setValidationResult(result);
    nextStep();
  };

  const canContinue = missingRequired.length === 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-brand-900">Map your columns</h2>
        <p className="text-sm text-brand-600 mt-1">
          We&apos;ve auto-detected some mappings. Review and adjust as needed.
        </p>
      </div>

      {/* Missing required fields warning */}
      {missingRequired.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-4">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Missing required fields
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              Please map the following required columns:{" "}
              {missingRequired.map((f) => f.label).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Mapping table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-[1fr,auto,1fr,auto] gap-0 text-sm">
          {/* Header */}
          <div className="bg-brand-50 px-4 py-3 font-medium text-brand-700 border-b border-border">
            Your Column
          </div>
          <div className="bg-brand-50 px-4 py-3 border-b border-border" />
          <div className="bg-brand-50 px-4 py-3 font-medium text-brand-700 border-b border-border">
            Maps To
          </div>
          <div className="bg-brand-50 px-4 py-3 font-medium text-brand-700 border-b border-border text-center">
            Sample
          </div>

          {/* Mapping rows */}
          {mappings.map((mapping, index) => {
            const targetField = fields.find((f) => f.key === mapping.targetField);
            const isRequired = targetField?.required;
            const isMapped = mapping.targetField !== null;

            return (
              <div key={index} className="contents">
                {/* Source column */}
                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                  <span className="font-medium text-brand-900">
                    {mapping.sourceColumn}
                  </span>
                  {mapping.confidence >= 0.9 && isMapped && (
                    <span className="inline-flex items-center rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                      Auto
                    </span>
                  )}
                </div>

                {/* Arrow */}
                <div className="px-2 py-3 border-b border-border flex items-center justify-center text-brand-400">
                  →
                </div>

                {/* Target field dropdown */}
                <div className="px-4 py-3 border-b border-border">
                  <select
                    value={mapping.targetField || ""}
                    onChange={(e) => handleMappingChange(mapping.sourceIndex, e.target.value)}
                    className={clsx(
                      "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500",
                      isMapped
                        ? "border-green-300 bg-green-50 text-green-800"
                        : "border-brand-200 bg-white text-brand-700"
                    )}
                  >
                    <option value="">-- Skip this column --</option>
                    <optgroup label="Required Fields">
                      {fields
                        .filter((f) => f.required)
                        .map((field) => (
                          <option
                            key={field.key}
                            value={field.key}
                            disabled={mappings.some(
                              (m) =>
                                m.targetField === field.key &&
                                m.sourceIndex !== mapping.sourceIndex
                            )}
                          >
                            {field.label}
                            {mappings.some(
                              (m) =>
                                m.targetField === field.key &&
                                m.sourceIndex !== mapping.sourceIndex
                            )
                              ? " (already mapped)"
                              : ""}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Optional Fields">
                      {fields
                        .filter((f) => !f.required)
                        .map((field) => (
                          <option
                            key={field.key}
                            value={field.key}
                            disabled={mappings.some(
                              (m) =>
                                m.targetField === field.key &&
                                m.sourceIndex !== mapping.sourceIndex
                            )}
                          >
                            {field.label}
                            {mappings.some(
                              (m) =>
                                m.targetField === field.key &&
                                m.sourceIndex !== mapping.sourceIndex
                            )
                              ? " (already mapped)"
                              : ""}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>

                {/* Sample values */}
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex flex-wrap gap-1">
                    {mapping.sampleValues.slice(0, 2).map((val, i) => (
                      <span
                        key={i}
                        className="inline-block max-w-[120px] truncate rounded bg-brand-100 px-2 py-0.5 text-xs text-brand-700"
                        title={val}
                      >
                        {val}
                      </span>
                    ))}
                    {mapping.sampleValues.length === 0 && (
                      <span className="text-xs text-brand-400 italic">No data</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-brand-600">
          <span className="font-medium text-brand-900">
            {mappings.filter((m) => m.targetField).length}
          </span>{" "}
          of {mappings.length} columns mapped
          {unmappedFields.filter((f) => !f.required).length > 0 && (
            <span className="ml-2 text-brand-500">
              ({unmappedFields.filter((f) => !f.required).length} optional fields available)
            </span>
          )}
        </div>

        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={clsx(
            "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all",
            canContinue
              ? "bg-brand-500 text-white hover:bg-brand-600"
              : "bg-brand-100 text-brand-400 cursor-not-allowed"
          )}
        >
          Validate Data
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
