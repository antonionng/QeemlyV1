"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowRight, Check } from "lucide-react";
import clsx from "clsx";
import {
  extractUniqueFieldValues,
  matchRole,
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

  const allRoles = useMemo(() => {
    if (!file || dataType !== "employees") return [];
    return extractUniqueFieldValues(file.rows, mappings, "role");
  }, [file, mappings, dataType]);

  const unresolvedRoles = useMemo(
    () => unresolvedRoleValues(allRoles).filter((value) => !roleMappings[value]),
    [allRoles, roleMappings],
  );

  const autoMappedRoles = useMemo(() => {
    return allRoles
      .map((rawRole) => {
        const mappedId = roleMappings[rawRole] ?? matchRole(rawRole);
        if (!mappedId) return null;
        return { rawRole, mappedId };
      })
      .filter((item): item is { rawRole: string; mappedId: string } => item !== null);
  }, [allRoles, roleMappings]);

  const unresolvedCount = unresolvedRoles.length;

  const optionLabelById = useMemo(() => new Map(options.map((option) => [option.id, option.label])), [options]);

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
          Roles drive benchmarking and compensation insights. Confirm the auto-mapped roles below and resolve any unmapped values.
        </p>
      </div>

      {unresolvedCount > 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <span>{unresolvedCount} roles need mapping before import can continue.</span>
        </div>
      )}

      {/* Section 1: Needs your input */}
      <section className="mb-6">
        <header className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-800">
            Needs your input
          </span>
          <span className="text-xs text-brand-500">{unresolvedRoles.length} value{unresolvedRoles.length === 1 ? "" : "s"}</span>
        </header>
        {unresolvedRoles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-brand-50/50 p-4 text-sm text-brand-600">
            All roles auto-mapped. Review them below and continue.
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-2 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
              <div>Uploaded role</div>
              <div>Qeemly role</div>
            </div>
            {unresolvedRoles.map((rawRole) => (
              <div
                key={rawRole}
                data-role-row
                className="grid grid-cols-2 items-center gap-4 border-t border-border px-4 py-3"
              >
                <div data-role-label className="text-sm text-brand-900">{rawRole}</div>
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
        )}
      </section>

      {/* Section 2: Auto-mapped */}
      <section className="mb-6">
        <header className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-800">
            Auto-mapped
          </span>
          <span className="text-xs text-brand-500">{autoMappedRoles.length} value{autoMappedRoles.length === 1 ? "" : "s"} - review and adjust</span>
        </header>
        {autoMappedRoles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-brand-50/50 p-4 text-sm text-brand-600">
            Nothing auto-mapped yet.
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-[1fr,1fr,auto] bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
              <div>Uploaded role</div>
              <div>Qeemly role</div>
              <div className="text-right">Status</div>
            </div>
            {autoMappedRoles.map(({ rawRole, mappedId }) => {
              const currentValue = roleMappings[rawRole] ?? mappedId;
              return (
                <div
                  key={rawRole}
                  data-role-row
                  className="grid grid-cols-[1fr,1fr,auto] items-center gap-4 border-t border-border px-4 py-3"
                >
                  <div data-role-label className="text-sm text-brand-900">{rawRole}</div>
                  <select
                    value={currentValue}
                    onChange={(e) => setRoleMapping(rawRole, e.target.value)}
                    className="rounded-lg border border-brand-200 px-3 py-2 text-sm text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {!options.some((option) => option.id === currentValue) && (
                      <option value={currentValue}>{optionLabelById.get(currentValue) ?? currentValue}</option>
                    )}
                    {options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="inline-flex items-center gap-1 justify-self-end text-xs font-medium text-emerald-700">
                    <Check className="h-3.5 w-3.5" />
                    Mapped
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

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
