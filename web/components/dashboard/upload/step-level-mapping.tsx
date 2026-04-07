"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowRight } from "lucide-react";
import clsx from "clsx";
import {
  applyValueMappingsToRows,
  extractUniqueFieldValues,
  hasTotalOnlySalaryRows,
  suggestedLevelCategoryForRole,
  toCustomMappingId,
  unresolvedLevelValues,
  unresolvedRoleValues,
  useUploadStore,
  validateData,
  type UploadMappingOptions,
} from "@/lib/upload";
import { useCompanySettings } from "@/lib/company";

export function StepLevelMapping() {
  const {
    dataType,
    file,
    mappings,
    roleMappings,
    levelMappings,
    departmentMappings,
    setLevelMapping,
    setValidationResult,
    nextStep,
  } = useUploadStore();
  const [options, setOptions] = useState<UploadMappingOptions["levels"]>([]);
  const [newLevelLabel, setNewLevelLabel] = useState("");
  const companySettingsConfigured = useCompanySettings((state) => state.isConfigured);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/upload/mapping-options", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as UploadMappingOptions;
      setOptions(payload.levels || []);
    })();
  }, []);

  const unresolvedLevels = useMemo(() => {
    if (!file || dataType !== "employees") return [];
    const uniqueLevels = extractUniqueFieldValues(file.rows, mappings, "level");
    return unresolvedLevelValues(uniqueLevels);
  }, [file, mappings, dataType]);

  const unresolvedRoles = useMemo(() => {
    if (!file || dataType !== "employees") return [];
    const uniqueRoles = extractUniqueFieldValues(file.rows, mappings, "role");
    return unresolvedRoleValues(uniqueRoles);
  }, [file, mappings, dataType]);

  const unresolvedRoleCount = unresolvedRoles.filter((value) => !roleMappings[value]).length;
  const unresolvedLevelCount = unresolvedLevels.filter((value) => !levelMappings[value]).length;
  const requiresDefaults = Boolean(file && hasTotalOnlySalaryRows(file.rows, mappings));
  const defaultsBlocked = requiresDefaults && !companySettingsConfigured;

  const handleContinue = () => {
    if (!file || !dataType) return;
    if (unresolvedRoleCount > 0 || unresolvedLevelCount > 0 || defaultsBlocked) return;

    const mappedRows = applyValueMappingsToRows(file.rows, mappings, {
      departmentMappings,
      roleMappings,
      levelMappings,
    });
    const result = validateData(mappedRows, mappings, dataType);
    setValidationResult(result);
    nextStep();
  };

  const createLevelAndMap = (sourceLevel: string) => {
    const label = newLevelLabel.trim() || sourceLevel.trim();
    if (!label) return;
    const id = toCustomMappingId(label);
    if (!options.some((option) => option.id === id)) {
      setOptions((current) => [
        ...current,
        {
          id,
          label,
          description: "Custom level created during import mapping.",
        },
      ]);
    }
    setLevelMapping(sourceLevel, id);
    setNewLevelLabel("");
  };

  if (dataType !== "employees") {
    return (
      <div className="p-6">
        <p className="text-sm text-brand-600">Level mapping is only required for employee uploads.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-brand-900">Map levels</h2>
        <p className="text-sm text-brand-600 mt-1">
          Levels are mandatory for benchmarking. Map each uploaded level to a Qeemly standard level.
        </p>
      </div>

      {(unresolvedRoleCount > 0 || unresolvedLevelCount > 0) && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <span>
            {unresolvedRoleCount > 0
              ? `${unresolvedRoleCount} roles need mapping. `
              : ""}
            {unresolvedLevelCount > 0 ? `${unresolvedLevelCount} levels need mapping.` : ""}
          </span>
        </div>
      )}

      {defaultsBlocked && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <span>
            Compensation defaults are required before importing rows that only provide total salary.
            Configure defaults in settings, then continue.
          </span>
        </div>
      )}

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-[1fr,1fr,1.5fr] bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          <div>Uploaded level</div>
          <div>Qeemly level</div>
          <div>Explanation</div>
        </div>
        {unresolvedLevels.map((rawLevel) => {
          const mappedLevel = levelMappings[rawLevel] || "";
          return (
            <div key={rawLevel} className="grid grid-cols-[1fr,1fr,1.5fr] items-center gap-4 border-t border-border px-4 py-3">
              <div className="text-sm text-brand-900">{rawLevel}</div>
              <select
                value={mappedLevel}
                onChange={(e) => setLevelMapping(rawLevel, e.target.value)}
                className="rounded-lg border border-brand-200 px-3 py-2 text-sm text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select level mapping</option>
                {options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.id.toUpperCase()}
                  </option>
                ))}
              </select>
              <div className="text-xs text-brand-600">
                {options.find((option) => option.id === mappedLevel)?.description ||
                  "Choose a level to see guidance."}
              </div>
                {!mappedLevel && (
                  <div className="col-span-3 mt-2 flex items-center gap-2">
                    <input
                      value={newLevelLabel}
                      onChange={(e) => setNewLevelLabel(e.target.value)}
                      placeholder={`Create new level for "${rawLevel}"`}
                      className="flex-1 rounded-lg border border-brand-200 px-3 py-2 text-sm text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => createLevelAndMap(rawLevel)}
                      className="rounded-lg border border-brand-300 px-3 py-2 text-xs font-medium text-brand-700 hover:bg-brand-50"
                    >
                      Create and map
                    </button>
                  </div>
                )}
            </div>
          );
        })}
      </div>

      {unresolvedRoles.length > 0 && (
        <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 p-3 text-xs text-brand-700">
          {unresolvedRoles.slice(0, 6).map((role) => (
            <p key={role}>
              {role}: suggested {suggestedLevelCategoryForRole(role) === "manager" ? "M-level" : "IC-level"} mapping.
            </p>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleContinue}
          disabled={unresolvedRoleCount > 0 || unresolvedLevelCount > 0 || defaultsBlocked}
          className={clsx(
            "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all",
            unresolvedRoleCount === 0 && unresolvedLevelCount === 0 && !defaultsBlocked
              ? "bg-brand-500 text-white hover:bg-brand-600"
              : "bg-brand-100 text-brand-400 cursor-not-allowed",
          )}
        >
          Validate Data
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
