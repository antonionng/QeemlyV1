"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { AdminPageError } from "@/components/admin/admin-page-error";
import { fetchAdminJson, normalizeAdminApiError, type NormalizedAdminApiError } from "@/lib/admin/api-client";
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Filter,
  Shield,
  Download,
} from "lucide-react";

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  department: string;
  role_id: string;
  level_id: string;
  location_id: string;
  base_salary: number;
  bonus: number | null;
  equity: number | null;
  currency: string;
  status: string;
  employment_type: string;
  hire_date: string | null;
  performance_rating: string | null;
  created_at: string;
};

type Workspace = {
  id: string;
  name: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

type EmployeeResponse = {
  workspace: Workspace;
  employees: Employee[];
  pagination: Pagination;
};

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString();
}

export default function TenantEmployeesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = use(params);
  const router = useRouter();
  
  const [data, setData] = useState<EmployeeResponse | null>(null);
  const [error, setError] = useState<NormalizedAdminApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
      });
      if (search) params.set("search", search);
      if (departmentFilter) params.set("department", departmentFilter);
      if (levelFilter) params.set("level", levelFilter);

      const result = await fetchAdminJson<EmployeeResponse>(`/api/admin/workspaces/${workspaceId}/employees?${params}`);
      setData(result);

      const depts = new Set<string>();
      const lvls = new Set<string>();
      for (const emp of result.employees) {
        if (emp.department) depts.add(emp.department);
        if (emp.level_id) lvls.add(emp.level_id);
      }
      if (departments.length === 0) setDepartments(Array.from(depts).sort());
      if (levels.length === 0) setLevels(Array.from(lvls).sort());
    } catch (err) {
      setError(normalizeAdminApiError(err));
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, page, departmentFilter, levelFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEmployees();
  };

  const clearFilters = () => {
    setSearch("");
    setDepartmentFilter("");
    setLevelFilter("");
    setPage(1);
  };

  const hasFilters = search || departmentFilter || levelFilter;

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch(`/api/admin/workspaces/${workspaceId}/employees/export`);
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Export failed");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${data?.workspace.name || "workspace"}-employees.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <AdminPageError error={error} onRetry={fetchEmployees} className="mb-6" />
      {/* Admin View Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-4 flex items-center gap-2">
        <Shield className="h-4 w-4 text-amber-600" />
        <span className="text-sm text-amber-700 font-medium">
          Admin View — This data is tenant-isolated. Other tenants cannot see this information.
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/tenants")}
            className="flex items-center gap-1 text-text-secondary transition-colors hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Tenants</span>
          </button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="page-title">
              {data?.workspace.name ?? "Loading..."} — Employees
            </h1>
            <p className="page-subtitle">
              {data?.pagination.total ?? 0} employees in this workspace
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchEmployees}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface-1 px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-2 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="panel mb-6 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#e0e3eb] rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#5C45FD]/20 focus:border-[#5C45FD]"
            />
          </form>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#64748b]" />
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-[#e0e3eb] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5C45FD]/20 focus:border-[#5C45FD]"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <select
            value={levelFilter}
            onChange={(e) => {
              setLevelFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-[#e0e3eb] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5C45FD]/20 focus:border-[#5C45FD]"
          >
            <option value="">All Levels</option>
            {levels.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-[#5C45FD] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="panel overflow-hidden">
        {loading && !data ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-6 w-6 animate-spin text-[#5C45FD] mx-auto" />
            <p className="text-sm text-[#64748b] mt-2">Loading employees...</p>
          </div>
        ) : data?.employees.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-10 w-10 text-[#c4b5fd] mx-auto mb-3" />
            <p className="text-[#64748b]">
              {hasFilters ? "No employees match your filters" : "No employees found"}
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-[#5C45FD] hover:underline mt-2"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e0e3eb] bg-[#fafafa]">
                    <th className="text-left py-3 px-5 font-medium text-[#64748b]">Name</th>
                    <th className="text-left py-3 px-5 font-medium text-[#64748b]">Department</th>
                    <th className="text-left py-3 px-5 font-medium text-[#64748b]">Role</th>
                    <th className="text-left py-3 px-5 font-medium text-[#64748b]">Level</th>
                    <th className="text-left py-3 px-5 font-medium text-[#64748b]">Location</th>
                    <th className="text-right py-3 px-5 font-medium text-[#64748b]">Base Salary</th>
                    <th className="text-left py-3 px-5 font-medium text-[#64748b]">Status</th>
                    <th className="text-left py-3 px-5 font-medium text-[#64748b]">Hire Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.employees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="border-b border-[#e0e3eb]/50 hover:bg-[#fafafa] transition-colors"
                    >
                      <td className="py-3 px-5">
                        <div>
                          <span className="font-medium text-[#0f0f1a]">
                            {emp.first_name} {emp.last_name}
                          </span>
                          {emp.email && (
                            <span className="block text-xs text-[#94a3b8]">{emp.email}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-5 text-[#64748b]">{emp.department}</td>
                      <td className="py-3 px-5">
                        <span className="font-mono text-xs bg-[#f5f3ff] text-[#5C45FD] px-2 py-1 rounded">
                          {emp.role_id}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <span className="font-mono text-xs bg-[#f0fdf4] text-emerald-700 px-2 py-1 rounded">
                          {emp.level_id}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-[#64748b]">{emp.location_id}</td>
                      <td className="py-3 px-5 text-right font-medium text-[#0f0f1a]">
                        {formatCurrency(emp.base_salary, emp.currency)}
                      </td>
                      <td className="py-3 px-5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            emp.status === "active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              emp.status === "active" ? "bg-emerald-500" : "bg-gray-400"
                            }`}
                          />
                          {emp.status}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-[#64748b]">{formatDate(emp.hire_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.pagination.total_pages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-[#e0e3eb]">
                <p className="text-sm text-[#64748b]">
                  Showing {(page - 1) * data.pagination.limit + 1} -{" "}
                  {Math.min(page * data.pagination.limit, data.pagination.total)} of{" "}
                  {data.pagination.total} employees
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 px-3 py-1.5 border border-[#e0e3eb] rounded-lg text-sm disabled:opacity-50 hover:bg-[#fafafa] transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </button>
                  <span className="text-sm text-[#64748b]">
                    Page {page} of {data.pagination.total_pages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(data.pagination.total_pages, p + 1))}
                    disabled={page === data.pagination.total_pages}
                    className="flex items-center gap-1 px-3 py-1.5 border border-[#e0e3eb] rounded-lg text-sm disabled:opacity-50 hover:bg-[#fafafa] transition-colors"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
