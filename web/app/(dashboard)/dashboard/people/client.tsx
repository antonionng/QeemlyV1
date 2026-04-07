"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2, RefreshCw, Settings, Users } from "lucide-react";
import { AddEmployeeModal } from "@/components/dashboard/people/add-employee-modal";
import { EmployeeDrawer } from "@/components/dashboard/people/employee-drawer";
import { PeopleCardGrid } from "@/components/dashboard/people/people-card-grid";
import { PeopleStatsBar } from "@/components/dashboard/people/people-stats-bar";
import { PeopleTable } from "@/components/dashboard/people/people-table";
import { PeopleToolbar } from "@/components/dashboard/people/people-toolbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import type { Department, Employee } from "@/lib/employees";
import {
  DEFAULT_PEOPLE_FILTERS,
  type PeopleBandFilter,
  type PeopleFilters,
  type UpdateEmployeeProfileInput,
  usePeople,
} from "@/lib/people/use-people";

function resolveBandFilterParam(value: string | null): PeopleBandFilter {
  if (value === "below" || value === "in-band" || value === "above" || value === "outside-band") {
    return value;
  }
  return "all";
}

function resolveDepartmentFilterParam(value: string | null): Department | "all" {
  const departments: Department[] = [
    "Engineering",
    "Product",
    "Design",
    "Data",
    "Sales",
    "Marketing",
    "Operations",
    "Finance",
    "HR",
  ];
  return value && departments.includes(value as Department) ? (value as Department) : "all";
}

function buildPeopleSearchHref({
  employeeId,
  band,
  department,
}: {
  employeeId?: string | null;
  band?: PeopleBandFilter;
  department?: Department | "all";
}) {
  const params = new URLSearchParams();
  if (employeeId) {
    params.set("employeeId", employeeId);
  }
  if (band && band !== "all") {
    params.set("band", band);
  }
  if (department && department !== "all") {
    params.set("department", department);
  }
  const queryString = params.toString();
  return queryString ? `/dashboard/people?${queryString}` : "/dashboard/people";
}

export function PeoplePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedEmployeeId = searchParams.get("employeeId");
  const requestedBandFilter = resolveBandFilterParam(searchParams.get("band"));
  const requestedDepartmentFilter = resolveDepartmentFilterParam(searchParams.get("department"));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [activeEmployee, setActiveEmployee] = useState<Employee | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const {
    employees,
    allEmployees,
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
    pendingDeletes,
    refresh,
    createEmployee,
    getEmployeeProfile,
    updateEmployeeProfile,
    queueDeleteEmployee,
    undoDeleteEmployee,
    bulkArchiveEmployees,
    exportFilteredCsv,
  } = usePeople();

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => employees.some((employee) => employee.id === id)));
  }, [employees]);

  useEffect(() => {
    if (!selectedEmployeeId) {
      setActiveEmployee(null);
      return;
    }

    const matchedEmployee = allEmployees.find((employee) => employee.id === selectedEmployeeId) || null;
    setActiveEmployee(matchedEmployee);
  }, [allEmployees, selectedEmployeeId]);

  useEffect(() => {
    setFilters((current) =>
      current.band === requestedBandFilter ? current : { ...current, band: requestedBandFilter }
    );
  }, [requestedBandFilter, setFilters]);

  useEffect(() => {
    setFilters((current) =>
      current.department === requestedDepartmentFilter
        ? current
        : { ...current, department: requestedDepartmentFilter }
    );
  }, [requestedDepartmentFilter, setFilters]);

  const activeWarnings = useMemo(() => {
    return actionError ? [actionError, ...warnings] : warnings;
  }, [actionError, warnings]);

  const handleOpenEmployee = (employee: Employee) => {
    setActionError(null);
    setActiveEmployee(employee);
    router.replace(
      buildPeopleSearchHref({
        employeeId: employee.id,
        band: filters.band,
        department: filters.department,
      }),
      { scroll: false }
    );
  };

  const handleCloseEmployee = () => {
    setActiveEmployee(null);
    router.replace(
      buildPeopleSearchHref({ band: filters.band, department: filters.department }),
      { scroll: false }
    );
  };

  const handleFiltersChange = (next: PeopleFilters) => {
    setFilters(next);
    router.replace(
      buildPeopleSearchHref({
        employeeId: selectedEmployeeId,
        band: next.band,
        department: next.department,
      }),
      { scroll: false }
    );
  };

  const handleToggleSelect = (employeeId: string) => {
    setSelectedIds((prev) =>
      prev.includes(employeeId) ? prev.filter((id) => id !== employeeId) : [...prev, employeeId]
    );
  };

  const handleToggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? employees.map((employee) => employee.id) : []);
  };

  const handleRefresh = async () => {
    setActionError(null);
    await refresh();
  };

  const handleCreateEmployee = async (payload: Parameters<typeof createEmployee>[0]) => {
    setActionError(null);
    try {
      await createEmployee(payload);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to create employee.");
      throw error;
    }
  };

  const handleSaveEmployee = async (employeeId: string, updates: UpdateEmployeeProfileInput) => {
    setActionError(null);
    try {
      await updateEmployeeProfile(employeeId, updates);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to save employee.");
      throw error;
    }
  };

  const handleQueueDelete = (employee: Employee) => {
    setActionError(null);
    if (activeEmployee?.id === employee.id) {
      handleCloseEmployee();
    }
    queueDeleteEmployee(employee);
  };

  const handleBulkArchive = async () => {
    setActionError(null);
    await bulkArchiveEmployees(selectedIds);
    setSelectedIds([]);
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-500" />
          <p className="mt-3 text-brand-600">Loading your people directory...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8" data-testid="people-page">
        <DashboardPageHeader
          title="People"
          subtitle="Browse every employee, review market context, and edit workforce records without leaving the platform workflow."
          actions={
            <>
              <Button variant="secondary" size="sm" onClick={() => void handleRefresh()}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setIsAddEmployeeOpen(true)}>
                <Users className="h-4 w-4" />
                Add Employee
              </Button>
            </>
          }
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border/70 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-500">
              People
            </p>
            <h2 className="mt-3 text-lg font-semibold text-brand-900">Employee profiles and pay context</h2>
            <p className="mt-2 text-sm text-accent-500">
              Use this space to manage employee records, compensation inputs, and workforce context that
              powers Qeemly insights.
            </p>
          </Card>
          <Card className="border-border/70 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-500">
              Boundaries
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Link href="/dashboard/team" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800">
                Team
                <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="text-sm text-accent-400">for workspace membership and invites</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Link href="/dashboard/settings/employees" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800">
                Employee Accounts
                <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="text-sm text-accent-400">for employee login access and provisioning</span>
            </div>
          </Card>
        </div>

        {activeWarnings.length > 0 && (
          <div className="space-y-3">
            {activeWarnings.map((warning, index) => (
              <Card key={`${warning}-${index}`} className="border-amber-200 bg-[#FFF4E5] p-4 text-sm text-amber-800">
                <div className="flex items-center justify-between gap-4">
                  <span>{warning}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActionError(null);
                      clearWarnings();
                    }}
                    className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700"
                  >
                    Dismiss
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {pendingDeletes.length > 0 && (
          <Card className="border-brand-200 bg-brand-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-brand-800">
                Removed {pendingDeletes[0].displayName || `${pendingDeletes[0].firstName} ${pendingDeletes[0].lastName}`}.
                Undo before the change is finalized.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => undoDeleteEmployee(pendingDeletes[0].id)}
              >
                Undo
              </Button>
            </div>
          </Card>
        )}

        {allEmployees.length === 0 ? (
          <Card className="border-dashed border-brand-200 bg-brand-50 p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-2xl">
                <h2 className="overview-section-title">Bring your people data into Qeemly</h2>
                <p className="overview-supporting-text mt-1">
                  Upload a roster or add employees manually to unlock people pages, benchmark positioning,
                  and compliance context.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/dashboard/upload">
                  <Button variant="secondary" size="sm">
                    Upload Data
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button size="sm" onClick={() => setIsAddEmployeeOpen(true)}>
                  Add Employee
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <>
            <PeopleStatsBar employees={employees} />
            <PeopleToolbar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              onAddEmployee={() => setIsAddEmployeeOpen(true)}
              onExportCsv={() => exportFilteredCsv(employees)}
            />

            {employees.length === 0 ? (
              <Card className="p-8 text-center">
                <h2 className="text-lg font-semibold text-brand-900">No employees match these filters</h2>
                <p className="mt-2 text-sm text-accent-500">
                  Try broadening your search or resetting the filters to see more of your workforce.
                </p>
                <div className="mt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleFiltersChange(DEFAULT_PEOPLE_FILTERS)}
                  >
                    Reset Filters
                  </Button>
                </div>
              </Card>
            ) : viewMode === "table" ? (
              <PeopleTable
                employees={employees}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onToggleSelectAll={handleToggleSelectAll}
                onBulkArchive={() => void handleBulkArchive()}
                onOpenDetails={handleOpenEmployee}
                onDelete={handleQueueDelete}
                onEditEmployee={handleOpenEmployee}
                mutating={mutating}
              />
            ) : (
              <PeopleCardGrid
                employees={employees}
                onOpenDetails={handleOpenEmployee}
                onDelete={handleQueueDelete}
              />
            )}
          </>
        )}
      </div>

      <AddEmployeeModal
        open={isAddEmployeeOpen}
        mutating={mutating}
        onClose={() => setIsAddEmployeeOpen(false)}
        onSubmit={handleCreateEmployee}
      />

      <EmployeeDrawer
        employee={activeEmployee}
        open={Boolean(activeEmployee)}
        mutating={mutating}
        onClose={handleCloseEmployee}
        onSave={handleSaveEmployee}
        onLoadProfile={getEmployeeProfile}
        onDelete={async (employeeId) => {
          const employee = allEmployees.find((row) => row.id === employeeId);
          if (employee) {
            handleQueueDelete(employee);
          }
        }}
      />
    </>
  );
}
