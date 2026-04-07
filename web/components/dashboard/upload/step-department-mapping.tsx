"use client";

import { useEffect, useMemo } from "react";
import { ArrowRight } from "lucide-react";
import clsx from "clsx";
import {
  defaultDepartmentMappings,
  extractUniqueFieldValues,
  useUploadStore,
} from "@/lib/upload";

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

  useEffect(() => {
    const defaults = defaultDepartmentMappings(departments);
    for (const [source, target] of Object.entries(defaults)) {
      if (!departmentMappings[source]) {
        setDepartmentMapping(source, target);
      }
    }
  }, [departments, departmentMappings, setDepartmentMapping]);

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
          Departments are flexible. We accept all uploaded values, then map and resolve before insert.
        </p>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-2 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          <div>Uploaded department</div>
          <div>Mapped department</div>
        </div>
        {departments.map((department) => (
          <div key={department} className="grid grid-cols-2 items-center gap-4 border-t border-border px-4 py-3">
            <div className="text-sm text-brand-900">{department}</div>
            <input
              value={departmentMappings[department] || ""}
              onChange={(e) => setDepartmentMapping(department, e.target.value)}
              className="rounded-lg border border-brand-200 px-3 py-2 text-sm text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Mapped department"
            />
          </div>
        ))}
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
