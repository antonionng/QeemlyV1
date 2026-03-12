"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchDbEmployees } from "@/lib/employees/data-service";
import type { BandPosition, Department, Employee, PerformanceRating } from "@/lib/employees";
import { LOCATIONS } from "@/lib/dashboard/dummy-data";

export type PeopleViewMode = "table" | "grid";
export type PeopleSortKey = "name" | "department" | "totalComp" | "marketComparison" | "hireDate";

type Filters = {
  search: string;
  department: Department | "all";
  locationId: string | "all";
  band: BandPosition | "all";
  performance: PerformanceRating | "all";
};

type CreateEmployeeInput = {
  firstName: string;
  lastName: string;
  email?: string;
  department: Department;
  roleId: string;
  levelId: string;
  locationId: string;
  baseSalary: number;
  bonus?: number;
  equity?: number;
  employmentType: "national" | "expat";
  performanceRating?: PerformanceRating;
  hireDate?: string;
};

type UpdateEmployeeInput = Partial<{
  firstName: string;
  lastName: string;
  email: string;
  department: Department;
  roleId: string;
  levelId: string;
  locationId: string;
  baseSalary: number;
  bonus: number;
  equity: number;
  status: "active" | "inactive";
  employmentType: "national" | "expat";
  performanceRating: PerformanceRating;
  hireDate: string;
}>;

const DEFAULT_FILTERS: Filters = {
  search: "",
  department: "all",
  locationId: "all",
  band: "all",
  performance: "all",
};

function getEmployeeLabel(employee: Employee): string {
  return employee.displayName || `${employee.firstName} ${employee.lastName}`.trim();
}

export function usePeople() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [pendingDeletes, setPendingDeletes] = useState<Array<{ employee: Employee; timeoutId: number }>>([]);
  const [viewMode, setViewMode] = useState<PeopleViewMode>("table");
  const [sortBy, setSortBy] = useState<PeopleSortKey>("name");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    const data = await fetchDbEmployees();
    setEmployees(data.filter((employee) => employee.status !== "inactive"));
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  const triggerComplianceRefresh = useCallback(async () => {
    try {
      const response = await fetch("/api/compliance/refresh", { method: "POST" });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || payload.ok === false) {
        setWarnings((prev) => [...prev, payload.error || "Compliance refresh is currently unavailable."]);
      }
    } catch {
      setWarnings((prev) => [...prev, "Compliance refresh is currently unavailable."]);
    }
  }, []);

  const clearWarnings = useCallback(() => setWarnings([]), []);

  const createEmployee = useCallback(
    async (input: CreateEmployeeInput) => {
      setMutating(true);
      try {
        const location = LOCATIONS.find((entry) => entry.id === input.locationId);
        const payload: Record<string, unknown> = {
          first_name: input.firstName.trim(),
          last_name: input.lastName.trim(),
          email: input.email?.trim().toLowerCase() || null,
          department: input.department,
          role_id: input.roleId,
          level_id: input.levelId,
          location_id: input.locationId,
          base_salary: Math.round(input.baseSalary),
          bonus: Math.round(input.bonus || 0),
          equity: Math.round(input.equity || 0),
          currency: location?.currency || "AED",
          status: "active" as const,
          employment_type: input.employmentType,
          performance_rating: input.performanceRating || null,
          hire_date: input.hireDate || new Date().toISOString().slice(0, 10),
        };

        const response = await fetch("/api/people", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const err = (await response.json()) as { error?: string };
          throw new Error(err.error || "Failed to create employee");
        }

        await Promise.all([loadEmployees(), triggerComplianceRefresh()]);
      } finally {
        setMutating(false);
      }
    },
    [loadEmployees, triggerComplianceRefresh]
  );

  const updateEmployee = useCallback(
    async (employeeId: string, updates: UpdateEmployeeInput) => {
      setMutating(true);
      try {
        const payload: Record<string, unknown> = {};
        if (updates.firstName !== undefined) payload.first_name = updates.firstName.trim();
        if (updates.lastName !== undefined) payload.last_name = updates.lastName.trim();
        if (updates.email !== undefined) payload.email = updates.email.trim().toLowerCase() || null;
        if (updates.department !== undefined) payload.department = updates.department;
        if (updates.roleId !== undefined) payload.role_id = updates.roleId;
        if (updates.levelId !== undefined) payload.level_id = updates.levelId;
        if (updates.locationId !== undefined) {
          payload.location_id = updates.locationId;
          payload.currency = LOCATIONS.find((entry) => entry.id === updates.locationId)?.currency || "AED";
        }
        if (updates.baseSalary !== undefined) payload.base_salary = Math.round(updates.baseSalary);
        if (updates.bonus !== undefined) payload.bonus = Math.round(updates.bonus);
        if (updates.equity !== undefined) payload.equity = Math.round(updates.equity);
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.employmentType !== undefined) payload.employment_type = updates.employmentType;
        if (updates.performanceRating !== undefined) payload.performance_rating = updates.performanceRating;
        if (updates.hireDate !== undefined) payload.hire_date = updates.hireDate;

        const response = await fetch(`/api/people/${employeeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const err = (await response.json()) as { error?: string };
          throw new Error(err.error || "Failed to update employee");
        }

        await Promise.all([loadEmployees(), triggerComplianceRefresh()]);
      } finally {
        setMutating(false);
      }
    },
    [loadEmployees, triggerComplianceRefresh]
  );

  const finalizeDeleteEmployee = useCallback(
    async (employeeId: string) => {
      setMutating(true);
      try {
        const response = await fetch(`/api/people/${employeeId}`, { method: "DELETE" });
        if (!response.ok) {
          const err = (await response.json()) as { error?: string };
          throw new Error(err.error || "Failed to delete employee");
        }

        await Promise.all([loadEmployees(), triggerComplianceRefresh()]);
      } catch (error) {
        setWarnings((prev) => [...prev, error instanceof Error ? error.message : "Failed to delete employee."]);
      } finally {
        setMutating(false);
      }
    },
    [loadEmployees, triggerComplianceRefresh]
  );

  const queueDeleteEmployee = useCallback(
    (employee: Employee, delayMs = 6000) => {
      setEmployees((prev) => prev.filter((row) => row.id !== employee.id));
      const timeoutId = window.setTimeout(() => {
        void finalizeDeleteEmployee(employee.id);
        setPendingDeletes((prev) => prev.filter((entry) => entry.employee.id !== employee.id));
      }, delayMs);
      setPendingDeletes((prev) => [...prev, { employee, timeoutId }]);
    },
    [finalizeDeleteEmployee]
  );

  const undoDeleteEmployee = useCallback((employeeId: string) => {
    setPendingDeletes((prev) => {
      const target = prev.find((entry) => entry.employee.id === employeeId);
      if (target) {
        window.clearTimeout(target.timeoutId);
        setEmployees((rows) => [target.employee, ...rows]);
      }
      return prev.filter((entry) => entry.employee.id !== employeeId);
    });
  }, []);

  const bulkArchiveEmployees = useCallback(
    async (employeeIds: string[]) => {
      if (!employeeIds.length) return;
      setMutating(true);
      try {
        const response = await fetch("/api/people", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "archive_many", ids: employeeIds }),
        });
        if (!response.ok) {
          const err = (await response.json()) as { error?: string };
          throw new Error(err.error || "Failed to archive employees");
        }
        await Promise.all([loadEmployees(), triggerComplianceRefresh()]);
      } catch (error) {
        setWarnings((prev) => [...prev, error instanceof Error ? error.message : "Bulk action failed"]);
      } finally {
        setMutating(false);
      }
    },
    [loadEmployees, triggerComplianceRefresh]
  );

  const exportFilteredCsv = useCallback((rows: Employee[]) => {
    const header = [
      "First Name",
      "Last Name",
      "Email",
      "Department",
      "Role",
      "Level",
      "Location",
      "Status",
      "Base Salary",
      "Bonus",
      "Equity",
      "Total Compensation",
      "Band Position",
      "Market Comparison %",
    ];
    const escape = (value: string | number) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const lines = rows.map((employee) =>
      [
        employee.firstName,
        employee.lastName,
        employee.email,
        employee.department,
        employee.role.title,
        employee.level.name,
        `${employee.location.city}, ${employee.location.country}`,
        employee.status,
        employee.baseSalary,
        employee.bonus || 0,
        employee.equity || 0,
        employee.totalComp,
        employee.bandPosition,
        employee.marketComparison,
      ]
        .map(escape)
        .join(",")
    );
    const csv = [header.map(escape).join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `people-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const filteredEmployees = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const list = employees.filter((employee) => {
      const matchesSearch =
        q.length === 0 ||
        getEmployeeLabel(employee).toLowerCase().includes(q) ||
        employee.email.toLowerCase().includes(q) ||
        employee.role.title.toLowerCase().includes(q);
      const matchesDepartment =
        filters.department === "all" || employee.department === filters.department;
      const matchesLocation =
        filters.locationId === "all" || employee.location.id === filters.locationId;
      const matchesBand = filters.band === "all" || employee.bandPosition === filters.band;
      const matchesPerformance =
        filters.performance === "all" || employee.performanceRating === filters.performance;
      return (
        matchesSearch &&
        matchesDepartment &&
        matchesLocation &&
        matchesBand &&
        matchesPerformance
      );
    });

    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortBy === "name") return getEmployeeLabel(a).localeCompare(getEmployeeLabel(b));
      if (sortBy === "department") return a.department.localeCompare(b.department);
      if (sortBy === "totalComp") return b.totalComp - a.totalComp;
      if (sortBy === "marketComparison") return b.marketComparison - a.marketComparison;
      return b.hireDate.getTime() - a.hireDate.getTime();
    });
    return sorted;
  }, [employees, filters, sortBy]);

  return {
    employees: filteredEmployees,
    allEmployees: employees,
    filters,
    setFilters,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    loading,
    mutating,
    warnings,
    clearWarnings,
    pendingDeletes: pendingDeletes.map((entry) => entry.employee),
    refresh: loadEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee: finalizeDeleteEmployee,
    queueDeleteEmployee,
    undoDeleteEmployee,
    bulkArchiveEmployees,
    exportFilteredCsv,
  };
}

