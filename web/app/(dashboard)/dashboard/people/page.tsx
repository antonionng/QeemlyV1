"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Users } from "lucide-react";
import { PeopleStatsBar } from "@/components/dashboard/people/people-stats-bar";
import { PeopleToolbar } from "@/components/dashboard/people/people-toolbar";
import { PeopleTable } from "@/components/dashboard/people/people-table";
import { PeopleCardGrid } from "@/components/dashboard/people/people-card-grid";
import { AddEmployeeModal } from "@/components/dashboard/people/add-employee-modal";
import { usePeople } from "@/lib/people/use-people";

export default function PeoplePage() {
  const {
    employees,
    allEmployees,
    filters,
    setFilters,
    loading,
    mutating,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    createEmployee,
    updateEmployee,
    queueDeleteEmployee,
    undoDeleteEmployee,
    pendingDeletes,
    bulkArchiveEmployees,
    exportFilteredCsv,
    warnings,
    clearWarnings,
  } = usePeople();
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const empty = useMemo(() => !loading && employees.length === 0, [employees.length, loading]);
  const latestPendingDelete = pendingDeletes[pendingDeletes.length - 1] || null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-accent-800 sm:text-3xl">People</h1>
          <p className="mt-1 text-sm text-accent-500">
            Central place to manage employee records, compensation context, and lifecycle data.
          </p>
        </div>
      </div>

      <PeopleStatsBar employees={allEmployees} />

      <PeopleToolbar
        filters={filters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        onAddEmployee={() => setShowAddModal(true)}
        onExportCsv={() => exportFilteredCsv(employees)}
      />

      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              Some background updates failed
            </p>
            <button type="button" onClick={clearWarnings} className="text-xs text-amber-700 underline">
              Dismiss
            </button>
          </div>
          <ul className="space-y-1 text-xs text-amber-700">
            {warnings.slice(-3).map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {empty ? (
        <div className="rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-brand-900">No employees match your filters</h3>
          <p className="mt-1 text-sm text-accent-500">Adjust filters or add new employees to start managing your team.</p>
        </div>
      ) : viewMode === "table" ? (
        <PeopleTable
          employees={employees}
          selectedIds={selectedIds}
          onToggleSelect={(id) =>
            setSelectedIds((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
          }
          onToggleSelectAll={(checked) => setSelectedIds(checked ? employees.map((employee) => employee.id) : [])}
          onBulkArchive={async () => {
            await bulkArchiveEmployees(selectedIds);
            setSelectedIds([]);
          }}
          onInlineSave={async (employeeId, updates) => {
            await updateEmployee(employeeId, updates as Parameters<typeof updateEmployee>[1]);
          }}
          mutating={mutating}
          onOpenDetails={(employee) => router.push(`/dashboard/people/${employee.id}`)}
          onDelete={async (employee) => {
            queueDeleteEmployee(employee);
          }}
        />
      ) : (
        <PeopleCardGrid
          employees={employees}
          onOpenDetails={(employee) => router.push(`/dashboard/people/${employee.id}`)}
          onDelete={async (employee) => {
            queueDeleteEmployee(employee);
          }}
        />
      )}

      <AddEmployeeModal
        open={showAddModal}
        mutating={mutating}
        onClose={() => setShowAddModal(false)}
        onSubmit={async (payload) => {
          await createEmployee(payload);
        }}
      />

      {latestPendingDelete && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-brand-200 bg-white p-3 shadow-lg">
          <p className="text-sm text-brand-900">
            {latestPendingDelete.firstName} {latestPendingDelete.lastName} queued for deletion.
          </p>
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => undoDeleteEmployee(latestPendingDelete.id)}
              className="text-xs font-semibold text-brand-600 underline"
            >
              Undo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

