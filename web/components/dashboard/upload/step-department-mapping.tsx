"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import clsx from "clsx";
import {
  DEPARTMENT_OPTIONS,
  defaultDepartmentMappings,
  extractUniqueFieldValues,
  isCanonicalDepartment,
  useUploadStore,
} from "@/lib/upload";

const CUSTOM_SENTINEL = "__custom__";

export function StepDepartmentMapping() {
  const {
    dataType,
    file,
    mappings,
    departmentMappings,
    setDepartmentMapping,
    nextStep,
  } = useUploadStore();

  const departments = useMemo(() => {
    if (!file || !dataType || dataType !== "employees") return [];
    return extractUniqueFieldValues(file.rows, mappings, "department");
  }, [file, mappings, dataType]);

  const [customMode, setCustomMode] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const defaults = defaultDepartmentMappings(departments);
    for (const [source, target] of Object.entries(defaults)) {
      if (!departmentMappings[source]) {
        setDepartmentMapping(source, target);
      }
    }
  }, [departments, departmentMappings, setDepartmentMapping]);

  // Detect rows whose mapped value isn't canonical so we surface a custom input.
  useEffect(() => {
    setCustomMode((prev) => {
      const next = { ...prev };
      for (const dept of departments) {
        const mapped = departmentMappings[dept];
        if (mapped && !isCanonicalDepartment(mapped) && next[dept] !== true) {
          next[dept] = true;
        }
      }
      return next;
    });
  }, [departments, departmentMappings]);

  if (dataType !== "employees") {
    return (
      <div className="p-6">
        <p className="text-sm text-brand-600">Department mapping is only required for employee uploads.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-brand-900">Map departments</h2>
        <p className="text-sm text-brand-600 mt-1">
          Choose a Qeemly department for each uploaded value. Use Custom only when no option fits.
        </p>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-2 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          <div>Uploaded department</div>
          <div>Mapped department</div>
        </div>
        {departments.map((department) => {
          const mapped = departmentMappings[department] || "";
          const isCustom = customMode[department] === true || (mapped !== "" && !isCanonicalDepartment(mapped));
          const selectValue = isCustom ? CUSTOM_SENTINEL : mapped;

          return (
            <div
              key={department}
              className="grid grid-cols-2 items-start gap-4 border-t border-border px-4 py-3"
            >
              <div className="text-sm text-brand-900 pt-2">{department}</div>
              <div className="space-y-2">
                <select
                  value={selectValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === CUSTOM_SENTINEL) {
                      setCustomMode((prev) => ({ ...prev, [department]: true }));
                      // Clear the canonical mapping so the user enters their own.
                      setDepartmentMapping(department, "");
                    } else {
                      setCustomMode((prev) => ({ ...prev, [department]: false }));
                      setDepartmentMapping(department, value);
                    }
                  }}
                  className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select department</option>
                  {DEPARTMENT_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                  <option value={CUSTOM_SENTINEL}>Custom...</option>
                </select>
                {isCustom && (
                  <input
                    value={mapped}
                    onChange={(e) => setDepartmentMapping(department, e.target.value)}
                    className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Enter custom department"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={nextStep}
          className={clsx(
            "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all",
            "bg-brand-500 text-white hover:bg-brand-600",
          )}
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
