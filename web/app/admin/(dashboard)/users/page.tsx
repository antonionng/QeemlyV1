"use client";

import { useEffect, useState } from "react";
import { AdminPageError } from "@/components/admin/admin-page-error";
import { fetchAdminJson, normalizeAdminApiError, type NormalizedAdminApiError } from "@/lib/admin/api-client";
import { Users, RefreshCw, Search, UserPlus, Shield, User, Building2, Eye, Mail, Calendar } from "lucide-react";

type Profile = { 
  id: string; 
  full_name: string | null; 
  role: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string;
  workspace_name?: string;
};

type WorkspaceOption = {
  id: string;
  name: string;
  slug: string;
};

function getRelativeTime(dateStr: string | undefined): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

export default function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState<NormalizedAdminApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [inviting, setInviting] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    setError(null);
    fetchAdminJson<Profile[]>("/api/admin/users")
      .then((data) => setProfiles(Array.isArray(data) ? data : []))
      .catch((err) => {
        setError(normalizeAdminApiError(err));
        setProfiles([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
    fetchAdminJson<WorkspaceOption[]>("/api/admin/workspaces")
      .then((rows) => setWorkspaces(Array.isArray(rows) ? rows : []))
      .catch((err) => {
        setError(normalizeAdminApiError(err));
        setWorkspaces([]);
      });
  }, []);

  const handleInvite = async () => {
    const email = window.prompt("User email");
    if (!email) return;
    const role = (window.prompt("Role (admin/member/employee)", "member") || "member").toLowerCase();

    if (workspaces.length === 0) {
      window.alert("No workspaces available. Create a tenant first.");
      return;
    }

    const workspacePrompt = workspaces
      .slice(0, 10)
      .map((workspace, index) => `${index + 1}. ${workspace.name} (${workspace.slug})`)
      .join("\n");
    const selectedIdx = Number(window.prompt(`Select workspace number:\n${workspacePrompt}`, "1")) - 1;
    const workspace = workspaces[selectedIdx] ?? workspaces[0];

    setInviting(true);
    try {
      const res = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, workspace_id: workspace.id }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || "Failed to invite user");
      }
      fetchUsers();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to invite user");
    } finally {
      setInviting(false);
    }
  };

  const filtered = profiles.filter((p) => {
    const matchesSearch = 
      (p.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.email || "").toLowerCase().includes(search.toLowerCase()) ||
      p.role.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleColors: Record<string, string> = {
    admin: "bg-brand-50 text-brand-600",
    member: "bg-blue-50 text-blue-700",
    employee: "bg-emerald-50 text-emerald-700",
  };

  const roleIcons: Record<string, React.ReactNode> = {
    admin: <Shield className="h-3 w-3" />,
    member: <User className="h-3 w-3" />,
    employee: <Building2 className="h-3 w-3" />,
  };

  const roleCounts = {
    admin: profiles.filter((p) => p.role === "admin").length,
    member: profiles.filter((p) => p.role === "member").length,
    employee: profiles.filter((p) => p.role === "employee").length,
  };

  return (
    <div>
      <AdminPageError error={error} onRetry={fetchUsers} className="mb-6" />
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">
            Global user directory across all tenants
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleInvite}
            disabled={inviting}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {inviting ? "Inviting..." : "Invite User"}
          </button>
        </div>
      </div>

      {/* Stats - Clickable role filters */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div
          className={`cursor-pointer rounded-xl border bg-surface-1 p-4 transition-colors ${
            roleFilter === "" ? "border-brand-500 ring-1 ring-brand-500/20" : "border-border hover:border-brand-200"
          }`}
          onClick={() => setRoleFilter("")}
        >
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-text-secondary" />
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Total Users</p>
          </div>
          <p className="text-2xl font-bold text-text-primary">{profiles.length}</p>
        </div>
        <div
          className={`cursor-pointer rounded-xl border bg-surface-1 p-4 transition-colors ${
            roleFilter === "admin" ? "border-brand-500 ring-1 ring-brand-500/20" : "border-border hover:border-brand-200"
          }`}
          onClick={() => setRoleFilter(roleFilter === "admin" ? "" : "admin")}
        >
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-brand-500" />
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Admins</p>
          </div>
          <p className="text-2xl font-bold text-brand-500">{roleCounts.admin}</p>
        </div>
        <div 
          className={`bg-white rounded-xl border p-4 cursor-pointer transition-colors ${
            roleFilter === "member" ? "border-blue-500 ring-1 ring-blue-500/20" : "border-[#e0e3eb] hover:border-blue-300"
          }`}
          onClick={() => setRoleFilter(roleFilter === "member" ? "" : "member")}
        >
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-blue-600" />
            <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide">Members</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{roleCounts.member}</p>
        </div>
        <div 
          className={`bg-white rounded-xl border p-4 cursor-pointer transition-colors ${
            roleFilter === "employee" ? "border-emerald-500 ring-1 ring-emerald-500/20" : "border-[#e0e3eb] hover:border-emerald-300"
          }`}
          onClick={() => setRoleFilter(roleFilter === "employee" ? "" : "employee")}
        >
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-4 w-4 text-emerald-600" />
            <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide">Employees</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{roleCounts.employee}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main table */}
        <div className="col-span-2 bg-white rounded-xl border border-[#e0e3eb] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e0e3eb] flex items-center justify-between">
            <h2 className="font-semibold text-[#0f0f1a]">
              {roleFilter ? `${roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}s` : "All Users"}
              {roleFilter && <span className="text-[#64748b] font-normal ml-2">({filtered.length})</span>}
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-[#e0e3eb] rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-[#5C45FD]/20 focus:border-[#5C45FD]"
              />
            </div>
          </div>
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="h-6 w-6 animate-spin text-[#5C45FD] mx-auto" />
              <p className="text-sm text-[#64748b] mt-2">Loading users...</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e0e3eb] bg-[#fafafa]">
                  <th className="text-left py-3 px-5 font-medium text-[#64748b]">User</th>
                  <th className="text-left py-3 px-5 font-medium text-[#64748b]">Role</th>
                  <th className="text-left py-3 px-5 font-medium text-[#64748b]">Last Active</th>
                  <th className="text-left py-3 px-5 font-medium text-[#64748b]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {error ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-5">
                      <AdminPageError error={error} onRetry={fetchUsers} />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center">
                      <Users className="h-8 w-8 text-[#c4b5fd] mx-auto mb-2" />
                      <p className="text-[#64748b]">No users found</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr 
                      key={p.id} 
                      className={`border-b border-[#e0e3eb]/50 hover:bg-[#fafafa] transition-colors cursor-pointer ${
                        selectedUser?.id === p.id ? "bg-[#f5f3ff]" : ""
                      }`}
                      onClick={() => setSelectedUser(p)}
                    >
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white font-medium text-sm ${
                            p.role === "admin" ? "bg-gradient-to-br from-[#5C45FD] to-[#7c6ff7]" :
                            p.role === "member" ? "bg-gradient-to-br from-blue-500 to-blue-400" :
                            "bg-gradient-to-br from-emerald-500 to-emerald-400"
                          }`}>
                            {(p.full_name || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-[#0f0f1a]">{p.full_name || "—"}</span>
                            {p.email && (
                              <span className="block text-xs text-[#94a3b8]">{p.email}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${roleColors[p.role] || "bg-gray-100 text-gray-700"}`}>
                          {roleIcons[p.role]}
                          {p.role}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-[#64748b]">
                        {getRelativeTime(p.last_sign_in_at)}
                      </td>
                      <td className="py-3 px-5">
                        <button 
                          className="flex items-center gap-1 text-[#5C45FD] text-sm font-medium hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(p);
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

        {/* User Detail Panel */}
        <div className="bg-white rounded-xl border border-[#e0e3eb] p-5">
          {selectedUser ? (
            <>
              <div className="text-center mb-6">
                <div className={`h-16 w-16 rounded-full mx-auto flex items-center justify-center text-white font-bold text-2xl ${
                  selectedUser.role === "admin" ? "bg-gradient-to-br from-[#5C45FD] to-[#7c6ff7]" :
                  selectedUser.role === "member" ? "bg-gradient-to-br from-blue-500 to-blue-400" :
                  "bg-gradient-to-br from-emerald-500 to-emerald-400"
                }`}>
                  {(selectedUser.full_name || "U")[0].toUpperCase()}
                </div>
                <h3 className="font-semibold text-[#0f0f1a] mt-3">{selectedUser.full_name || "Unknown User"}</h3>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize mt-2 ${roleColors[selectedUser.role]}`}>
                  {roleIcons[selectedUser.role]}
                  {selectedUser.role}
                </span>
              </div>

              <div className="space-y-4">
                <div className="border border-[#e0e3eb] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-[#64748b]" />
                    <span className="text-xs font-medium text-[#64748b]">Contact</span>
                  </div>
                  <p className="text-sm text-[#0f0f1a]">{selectedUser.email || "No email"}</p>
                </div>

                <div className="border border-[#e0e3eb] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-[#64748b]" />
                    <span className="text-xs font-medium text-[#64748b]">Workspace</span>
                  </div>
                  <p className="text-sm text-[#0f0f1a]">{selectedUser.workspace_name || "—"}</p>
                </div>

                <div className="border border-[#e0e3eb] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-[#64748b]" />
                    <span className="text-xs font-medium text-[#64748b]">Activity</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Last Sign In</span>
                      <span className="text-[#0f0f1a]">{getRelativeTime(selectedUser.last_sign_in_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Created</span>
                      <span className="text-[#0f0f1a]">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#e0e3eb]">
                  <p className="text-xs text-[#94a3b8] font-mono">{selectedUser.id?.slice(0, 20)}…</p>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <Users className="h-10 w-10 text-[#c4b5fd] mb-3" />
              <p className="text-[#64748b]">Select a user</p>
              <p className="text-xs text-[#94a3b8] mt-1">Click on a row to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
