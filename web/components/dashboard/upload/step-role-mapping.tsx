"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowRight } from "lucide-react";
import clsx from "clsx";
import {
  extractUniqueFieldValues,
  toCustomMappingId,
  unresolvedRoleValues,
  useUploadStore,
  type UploadMappingOptions,
} from "@/lib/upload";

export function StepRoleMapping() {
  const { dataType, file, mappings, roleMappings, setRoleMapping, nextStep } = useUploadStore();
  const [options, setOptions] = useState<UploadMappingOptions["roles"]>([]);
  const [newRoleLabel, setNewRoleLabel] = useState("");

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/upload/mapping-options", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as UploadMappingOptions;
      setOptions(payload.roles || []);
    })();
  }, []);

  const unresolvedRoles = useMemo(() => {
    if (!file || dataType !== "employees") return [];
    const uniqueRoles = extractUniqueFieldValues(file.rows, mappings, "role");
    return unresolvedRoleValues(uniqueRoles);
  }, [file, mappings, dataType]);

  const unresolvedCount = unresolvedRoles.filter((value) => !roleMappings[value]).length;

  const createRoleAndMap = (sourceRole: string) => {
    const label = newRoleLabel.trim() || sourceRole.trim();
    if (!label) return;
    const id = toCustomMappingId(label);
    if (!options.some((option) => option.id === id)) {
      setOptions((current) => [...current, { id, label }]);
    }
    setRoleMapping(sourceRole, id);
    setNewRoleLabel("");
  };

  if (dataType !== "employees") {
    return (
      <div className="p-6">
        <p className="text-sm text-brand-600">Role mapping is only required for employee uploads.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-brand-900">Map roles</h2>
        <p className="text-sm text-brand-600 mt-1">
          Roles drive benchmarking and compensation insights. All unresolved roles must be mapped.
        </p>
      </div>

      {unresolvedCount > 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <span>{unresolvedCount} roles need mapping before import can continue.</span>
        </div>
      )}

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-2 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          <div>Uploaded role</div>
          <div>Qeemly role</div>
        </div>
        {unresolvedRoles.map((rawRole) => (
          <div key={rawRole} className="grid grid-cols-2 items-center gap-4 border-t border-border px-4 py-3">
            <div className="text-sm text-brand-900">{rawRole}</div>
            <select
              value={roleMappings[rawRole] || ""}
              onChange={(e) => setRoleMapping(rawRole, e.target.value)}
              className="rounded-lg border border-brand-200 px-3 py-2 text-sm text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select role mapping</option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            {!roleMappings[rawRole] && (
              <div className="col-span-2 mt-2 flex items-center gap-2">
                <input
                  value={newRoleLabel}
                  onChange={(e) => setNewRoleLabel(e.target.value)}
                  placeholder={`Create new role for "${rawRole}"`}
                  className="flex-1 rounded-lg border border-brand-200 px-3 py-2 text-sm text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={() => createRoleAndMap(rawRole)}
                  className="rounded-lg border border-brand-300 px-3 py-2 text-xs font-medium text-brand-700 hover:bg-brand-50"
                >
                  Create and map
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={nextStep}
          disabled={unresolvedCount > 0}
          className={clsx(
            "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all",
            unresolvedCount === 0
              ? "bg-brand-500 text-white hover:bg-brand-600"
              : "bg-brand-100 text-brand-400 cursor-not-allowed",
          )}
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
