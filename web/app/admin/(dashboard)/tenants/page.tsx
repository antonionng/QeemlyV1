"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPageError } from "@/components/admin/admin-page-error";
import { fetchAdminJson, normalizeAdminApiError, type NormalizedAdminApiError } from "@/lib/admin/api-client";
import {
  Building2,
  RefreshCw,
  Search,
  Plus,
  Users,
  BarChart3,
  CheckCircle,
  Eye,
  FileUp,
  DollarSign,
  Briefcase,
  Loader2,
  ExternalLink,
} from "lucide-react";

type Workspace = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  employee_count: number;
  avg_base_salary: number | null;
  department_count: number;
  upload_count: number;
  last_upload_at: string | null;
};

type Stats = {
  benchmarks: { total: number };
};

type DepartmentStats = {
  department: string;
  count: number;
  avg_salary: number;
  min_salary: number;
  max_salary: number;
};

type LevelStats = {
  level: string;
  count: number;
};

type UploadRecord = {
  id: string;
  upload_type: string;
  file_name: string;
  row_count: number | null;
  created_at: string;
};

type TenantSummary = {
  workspace: { id: string; name: string; slug: string; created_at: string };
  summary: {
    total_employees: number;
    active_employees: number;
    avg_salary: number | null;
    department_count: number;
    level_count: number;
  };
  by_department: DepartmentStats[];
  by_level: LevelStats[];
  recent_uploads: UploadRecord[];
};

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays < 1) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

function formatCurrency(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function TenantsPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<NormalizedAdminApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<Workspace | null>(null);
  const [tenantSummary, setTenantSummary] = useState<TenantSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [creatingTenant, setCreatingTenant] = useState(false);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchAdminJson<Workspace[]>("/api/admin/workspaces"),
      fetchAdminJson<Stats>("/api/admin/stats"),
    ])
      .then(([wsData, statsData]) => {
        setWorkspaces(Array.isArray(wsData) ? wsData : []);
        setStats(statsData);
      })
      .catch((err) => {
        setError(normalizeAdminApiError(err));
        setWorkspaces([]);
        setStats(null);
      })
      .finally(() => setLoading(false));
  };

  const fetchTenantSummary = async (workspaceId: string) => {
    setSummaryLoading(true);
    setTenantSummary(null);
    try {
      const res = await fetch(`/api/admin/workspaces/${workspaceId}/summary`);
      if (res.ok) {
        const data = await res.json();
        setTenantSummary(data);
      }
    } catch {
      setTenantSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      fetchTenantSummary(selectedTenant.id);
    } else {
      setTenantSummary(null);
    }
  }, [selectedTenant]);

  const handleCreateTenant = async () => {
    const name = window.prompt("Tenant name");
    if (!name) return;

    setCreatingTenant(true);
    try {
      const res = await fetch("/api/admin/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || "Failed to create tenant");
      }
      fetchData();
      setSelectedTenant(payload);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to create tenant");
    } finally {
      setCreatingTenant(false);
    }
  };

  const filtered = workspaces.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.slug.toLowerCase().includes(search.toLowerCase())
  );

  const recentTenants = workspaces.filter((w) => {
    const created = new Date(w.created_at);
    const now = new Date();
    const diffDays = (now.getTime() - created.getTime()) / 86400000;
    return diffDays <= 30;
  }).length;

  const totalEmployees = workspaces.reduce((acc, w) => acc + (w.employee_count || 0), 0);

  return (
    <div>
      <AdminPageError error={error} onRetry={fetchData} className="mb-6" />
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Tenants</h1>
          <p className="page-subtitle">
            Manage client workspaces and view their uploaded employee data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleCreateTenant}
            disabled={creatingTenant}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {creatingTenant ? "Creating..." : "Add Tenant"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-5 gap-4">
        <div className="panel p-4">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-4 w-4 text-brand-500" />
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
              Total Tenants
            </p>
          </div>
          <p className="text-2xl font-bold text-text-primary">{workspaces.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e0e3eb] p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide">Active</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{workspaces.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e0e3eb] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Plus className="h-4 w-4 text-[#5C45FD]" />
            <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide">New (30d)</p>
          </div>
          <p className="text-2xl font-bold text-[#5C45FD]">{recentTenants}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e0e3eb] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-blue-500" />
            <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide">
              Total Employees
            </p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{totalEmployees.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e0e3eb] p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-4 w-4 text-amber-500" />
            <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide">Benchmarks</p>
          </div>
          <p className="text-2xl font-bold text-amber-600">
            {stats?.benchmarks.total?.toLocaleString() ?? "—"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main table */}
        <div className="col-span-2 bg-white rounded-xl border border-[#e0e3eb] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e0e3eb] flex items-center justify-between">
            <h2 className="font-semibold text-[#0f0f1a]">All Workspaces</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Search tenants..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-[#e0e3eb] rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-[#5C45FD]/20 focus:border-[#5C45FD]"
              />
            </div>
          </div>
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="h-6 w-6 animate-spin text-[#5C45FD] mx-auto" />
              <p className="text-sm text-[#64748b] mt-2">Loading tenants...</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e0e3eb] bg-[#fafafa]">
                  <th className="text-left py-3 px-5 font-medium text-[#64748b]">Tenant</th>
                  <th className="text-left py-3 px-5 font-medium text-[#64748b]">Employees</th>
                  <th className="text-left py-3 px-5 font-medium text-[#64748b]">Last Upload</th>
                  <th className="text-left py-3 px-5 font-medium text-[#64748b]">Status</th>
                  <th className="text-left py-3 px-5 font-medium text-[#64748b]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {error ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-5">
                      <AdminPageError error={error} onRetry={fetchData} />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <Building2 className="h-8 w-8 text-[#c4b5fd] mx-auto mb-2" />
                      <p className="text-[#64748b]">No tenants found</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((w) => (
                    <tr
                      key={w.id}
                      className={`border-b border-[#e0e3eb]/50 hover:bg-[#fafafa] transition-colors cursor-pointer ${
                        selectedTenant?.id === w.id ? "bg-[#f5f3ff]" : ""
                      }`}
                      onClick={() => setSelectedTenant(w)}
                    >
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#5C45FD] to-[#7c6ff7] flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {w.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-[#0f0f1a]">{w.name}</span>
                            <span className="block text-xs text-[#94a3b8]">{w.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <span className="font-medium text-[#0f0f1a]">
                          {w.employee_count > 0 ? w.employee_count.toLocaleString() : "—"}
                        </span>
                        {w.department_count > 0 && (
                          <span className="block text-xs text-[#94a3b8]">
                            {w.department_count} dept{w.department_count !== 1 ? "s" : ""}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-[#64748b]">
                        {w.last_upload_at ? getRelativeTime(w.last_upload_at) : "—"}
                      </td>
                      <td className="py-3 px-5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <button
                          className="flex items-center gap-1 text-[#5C45FD] text-sm font-medium hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTenant(w);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Tenant Detail Panel */}
        <div className="bg-white rounded-xl border border-[#e0e3eb] p-5 max-h-[calc(100vh-280px)] overflow-y-auto">
          {selectedTenant ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#5C45FD] to-[#7c6ff7] flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {selectedTenant.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0f0f1a]">{selectedTenant.name}</h3>
                    <p className="text-xs text-[#94a3b8]">{selectedTenant.slug}</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/admin/tenants/${selectedTenant.id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5C45FD] text-white text-xs font-medium rounded-lg hover:bg-[#4c38d4] transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  View Employees
                </button>
              </div>

              {summaryLoading ? (
                <div className="py-8 text-center">
                  <Loader2 className="h-5 w-5 animate-spin text-[#5C45FD] mx-auto" />
                  <p className="text-xs text-[#64748b] mt-2">Loading summary...</p>
                </div>
              ) : tenantSummary ? (
                <div className="space-y-4">
                  {/* Employee Summary */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border border-[#e0e3eb] rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-3.5 w-3.5 text-[#64748b]" />
                        <span className="text-xs text-[#64748b]">Employees</span>
                      </div>
                      <p className="text-lg font-bold text-[#0f0f1a]">
                        {tenantSummary.summary.total_employees}
                      </p>
                      <p className="text-xs text-emerald-600">
                        {tenantSummary.summary.active_employees} active
                      </p>
                    </div>
                    <div className="border border-[#e0e3eb] rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-3.5 w-3.5 text-[#64748b]" />
                        <span className="text-xs text-[#64748b]">Avg Salary</span>
                      </div>
                      <p className="text-lg font-bold text-[#0f0f1a]">
                        {formatCurrency(tenantSummary.summary.avg_salary)}
                      </p>
                    </div>
                  </div>

                  {/* Department Breakdown */}
                  {tenantSummary.by_department.length > 0 && (
                    <div className="border border-[#e0e3eb] rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Briefcase className="h-3.5 w-3.5 text-[#64748b]" />
                        <span className="text-xs font-medium text-[#64748b]">By Department</span>
                      </div>
                      <div className="space-y-2">
                        {tenantSummary.by_department.slice(0, 5).map((d) => (
                          <div key={d.department} className="flex items-center justify-between text-sm">
                            <span className="text-[#0f0f1a] truncate max-w-[120px]" title={d.department}>
                              {d.department}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[#64748b]">{d.count}</span>
                              <span className="text-xs text-[#94a3b8]">
                                {formatCurrency(d.avg_salary)}
                              </span>
                            </div>
                          </div>
                        ))}
                        {tenantSummary.by_department.length > 5 && (
                          <p className="text-xs text-[#94a3b8]">
                            +{tenantSummary.by_department.length - 5} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Level Breakdown */}
                  {tenantSummary.by_level.length > 0 && (
                    <div className="border border-[#e0e3eb] rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-3">
                        <BarChart3 className="h-3.5 w-3.5 text-[#64748b]" />
                        <span className="text-xs font-medium text-[#64748b]">By Level</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tenantSummary.by_level.map((l) => (
                          <span
                            key={l.level}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-[#f5f3ff] text-[#5C45FD] rounded text-xs font-medium"
                          >
                            {l.level}: {l.count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Uploads */}
                  <div className="border border-[#e0e3eb] rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-3">
                      <FileUp className="h-3.5 w-3.5 text-[#64748b]" />
                      <span className="text-xs font-medium text-[#64748b]">Recent Uploads</span>
                    </div>
                    {tenantSummary.recent_uploads.length > 0 ? (
                      <div className="space-y-2">
                        {tenantSummary.recent_uploads.slice(0, 3).map((u) => (
                          <div key={u.id} className="flex items-center justify-between text-sm">
                            <div>
                              <span className="text-[#0f0f1a] text-xs truncate block max-w-[140px]" title={u.file_name}>
                                {u.file_name}
                              </span>
                              <span className="text-xs text-[#94a3b8]">{u.upload_type}</span>
                            </div>
                            <span className="text-xs text-[#64748b]">
                              {getRelativeTime(u.created_at)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#94a3b8]">No uploads yet</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#e0e3eb]">
                    <p className="text-xs text-[#94a3b8]">
                      Created {new Date(selectedTenant.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border border-[#e0e3eb] rounded-lg p-4 text-center">
                    <Users className="h-8 w-8 text-[#c4b5fd] mx-auto mb-2" />
                    <p className="text-sm text-[#64748b]">No employee data yet</p>
                    <p className="text-xs text-[#94a3b8] mt-1">
                      This tenant hasn&apos;t uploaded any employee data
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#e0e3eb]">
                    <p className="text-xs text-[#94a3b8]">
                      Created {new Date(selectedTenant.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <Building2 className="h-10 w-10 text-[#c4b5fd] mb-3" />
              <p className="text-[#64748b]">Select a tenant</p>
              <p className="text-xs text-[#94a3b8] mt-1">Click on a row to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
