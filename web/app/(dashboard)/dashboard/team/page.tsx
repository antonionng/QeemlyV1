"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  ShieldCheck,
  Loader2, 
  Clock,
  Trash2,
  RefreshCw,
  UserCog,
  ChevronDown,
  X,
  CheckCircle,
  AlertCircle,
  Building2,
  Crown,
  User,
  Briefcase,
  Search,
} from "lucide-react";

type Member = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  is_current_user: boolean;
  email: string | null;
};

type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
};

type Toast = {
  type: "success" | "error";
  message: string;
};

export default function TeamPage() {
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>("member");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("member");
  const [toast, setToast] = useState<Toast | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [roleMenuOpen, setRoleMenuOpen] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const showToast = (type: Toast["type"], message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadTeamData = useCallback(async () => {
    try {
      const res = await fetch("/api/team");
      if (!res.ok) throw new Error("Failed to load team data");
      
      const data = await res.json();
      setMembers(data.members || []);
      setInvitations(data.invitations || []);
      setCurrentUserRole(data.current_user_role || "member");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    
    setInviting(true);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send invitation");
      }
      
      showToast("success", `Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setInviteRole("member");
      loadTeamData();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;
    
    setActionLoading(memberId);
    try {
      const res = await fetch("/api/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: memberId }),
      });
      
      if (!res.ok) throw new Error("Failed to remove member");
      
      showToast("success", "Team member removed successfully");
      loadTeamData();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setActionLoading(null);
    }
  };

  const changeRole = async (memberId: string, newRole: string) => {
    setActionLoading(memberId);
    setRoleMenuOpen(null);
    try {
      const res = await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: memberId, role: newRole }),
      });
      
      if (!res.ok) throw new Error("Failed to change role");
      
      showToast("success", "Role updated successfully");
      loadTeamData();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to change role");
    } finally {
      setActionLoading(null);
    }
  };

  const resendInvitation = async (inviteId: string) => {
    setActionLoading(inviteId);
    try {
      const res = await fetch("/api/team/invite", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId: inviteId }),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to resend invitation");
      }
      
      showToast("success", "Invitation resent successfully");
      loadTeamData();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to resend invitation");
    } finally {
      setActionLoading(null);
    }
  };

  const cancelInvitation = async (inviteId: string) => {
    if (!confirm("Are you sure you want to cancel this invitation?")) return;
    
    setActionLoading(inviteId);
    try {
      const res = await fetch("/api/team/invite", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId: inviteId }),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to cancel invitation");
      }
      
      showToast("success", "Invitation cancelled");
      loadTeamData();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to cancel invitation");
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "employee":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-3 w-3" />;
      case "employee":
        return <Briefcase className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Admin";
      case "employee": return "Employee";
      default: return "Member";
    }
  };

  const isAdmin = currentUserRole === "admin";

  // Stats
  const adminCount = members.filter(m => m.role === "admin").length;
  const memberCount = members.filter(m => m.role === "member").length;
  const employeeCount = members.filter(m => m.role === "employee").length;

  // Filter members
  const filteredMembers = members.filter(m => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (m.full_name?.toLowerCase().includes(query)) ||
      (m.email?.toLowerCase().includes(query))
    );
  });

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-md ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-accent-800 sm:text-3xl">Team Management</h1>
          <p className="text-brand-600">Manage your workspace members, roles, and invitations.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-200">
            <Building2 size={16} className="text-brand-500" />
            Workspace
          </div>
          <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ring-1 ${
            isAdmin 
              ? "bg-purple-50 text-purple-700 ring-purple-200" 
              : "bg-gray-50 text-gray-700 ring-gray-200"
          }`}>
            <ShieldCheck size={16} />
            {isAdmin ? "Administrator" : "Member"}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <Users size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-900">{members.length}</p>
              <p className="text-xs text-brand-500">Total Members</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <Crown size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-900">{adminCount}</p>
              <p className="text-xs text-brand-500">Admins</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Briefcase size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-900">{employeeCount}</p>
              <p className="text-xs text-brand-500">Employees</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Mail size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-900">{invitations.length}</p>
              <p className="text-xs text-brand-500">Pending Invites</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Invite Form - Only for admins */}
        {isAdmin && (
          <Card className="h-fit lg:col-span-1">
            <div className="border-b border-border/50 bg-gradient-to-r from-brand-50 to-purple-50 px-6 py-4">
              <div className="flex items-center gap-2 text-brand-900">
                <UserPlus size={20} className="text-brand-500" />
                <h2 className="font-bold">Invite Team Member</h2>
              </div>
              <p className="text-xs text-brand-500 mt-1">Add new members to your workspace</p>
            </div>
            <form onSubmit={sendInvite} className="p-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-brand-900">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  fullWidth
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-semibold text-brand-900">
                  Role
                </label>
                <select
                  id="role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
                >
                  <option value="member">Member - Can view and analyze data</option>
                  <option value="admin">Admin - Full workspace access</option>
                  <option value="employee">Employee - Limited self-service access</option>
                </select>
                <p className="text-xs text-brand-400">
                  {inviteRole === "admin" && "Admins can manage team members, settings, and all data."}
                  {inviteRole === "member" && "Members can view benchmarks, reports, and analyze compensation."}
                  {inviteRole === "employee" && "Employees can view their own compensation details."}
                </p>
              </div>
              <Button type="submit" fullWidth isLoading={inviting} className="mt-2">
                <Mail className="h-4 w-4 mr-2" />
                Send Invitation
              </Button>
            </form>
          </Card>
        )}

        {/* Members List */}
        <div className={`space-y-6 ${isAdmin ? "lg:col-span-2" : "lg:col-span-3"}`}>
          <Card className="overflow-hidden">
            <div className="border-b border-border/50 bg-gradient-to-r from-brand-50 to-purple-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-brand-900 uppercase tracking-wider flex items-center gap-2">
                    <Users size={16} />
                    Active Members
                    <span className="ml-1 px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full text-xs">
                      {members.length}
                    </span>
                  </h2>
                </div>
                {members.length > 3 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-400" />
                    <input
                      type="text"
                      placeholder="Search members..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-3 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-48"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="divide-y divide-border/50">
              {filteredMembers.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-brand-50 mb-4">
                    <Users className="h-8 w-8 text-brand-300" />
                  </div>
                  {members.length === 0 ? (
                    <>
                      <p className="text-brand-900 font-medium">No team members yet</p>
                      <p className="text-sm text-brand-500 mt-1">
                        {isAdmin ? "Start by inviting your first team member above." : "Team members will appear here once added."}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-brand-900 font-medium">No matching members</p>
                      <p className="text-sm text-brand-500 mt-1">Try adjusting your search query.</p>
                    </>
                  )}
                </div>
              ) : (
                filteredMembers.map((member, index) => (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between px-6 py-4 hover:bg-brand-50/30 transition-colors ${
                      index === 0 ? "" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="h-12 w-12 overflow-hidden rounded-xl bg-brand-100 ring-2 ring-white shadow-sm">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.full_name || "Member"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-400 to-brand-600 text-white font-bold text-lg">
                              {(member.full_name || member.email || "M").charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        {member.is_current_user && (
                          <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-brand-900 flex items-center gap-2">
                          {member.full_name || "Unnamed Member"}
                          {member.is_current_user && (
                            <span className="text-xs bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-medium">You</span>
                          )}
                        </div>
                        <div className="text-xs text-brand-500 mt-0.5">
                          {member.email || "Email hidden"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Role Badge / Dropdown */}
                      {isAdmin && !member.is_current_user ? (
                        <div className="relative">
                          <button
                            onClick={() =>
                              setRoleMenuOpen(roleMenuOpen === member.id ? null : member.id)
                            }
                            disabled={actionLoading === member.id}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all hover:shadow-sm ${getRoleBadgeStyle(member.role)}`}
                          >
                            {actionLoading === member.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                {getRoleIcon(member.role)}
                                {getRoleLabel(member.role)}
                                <ChevronDown className="h-3 w-3 ml-1" />
                              </>
                            )}
                          </button>
                          {roleMenuOpen === member.id && (
                            <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-lg border border-border z-10 overflow-hidden">
                              <div className="py-1">
                                {["admin", "member", "employee"].map((r) => (
                                  <button
                                    key={r}
                                    onClick={() => changeRole(member.id, r)}
                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 flex items-center gap-2 ${
                                      member.role === r ? "bg-brand-50 font-medium" : ""
                                    }`}
                                  >
                                    {getRoleIcon(r)}
                                    {getRoleLabel(r)}
                                    {member.role === r && (
                                      <CheckCircle className="h-3 w-3 text-brand-500 ml-auto" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border ${getRoleBadgeStyle(member.role)}`}
                        >
                          {getRoleIcon(member.role)}
                          {getRoleLabel(member.role)}
                        </span>
                      )}

                      {/* Remove Button */}
                      {isAdmin && !member.is_current_user && (
                        <button
                          onClick={() => removeMember(member.id)}
                          disabled={actionLoading === member.id}
                          className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Remove from team"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Pending Invitations */}
          <Card className="overflow-hidden">
            <div className="border-b border-border/50 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4">
              <h2 className="text-sm font-bold text-brand-900 uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} className="text-amber-500" />
                Pending Invitations
                <span className="ml-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
                  {invitations.length}
                </span>
              </h2>
            </div>
            <div className="divide-y divide-border/50">
              {invitations.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-amber-50 mb-3">
                    <Mail className="h-6 w-6 text-amber-300" />
                  </div>
                  <p className="text-sm text-brand-500">No pending invitations</p>
                  {isAdmin && (
                    <p className="text-xs text-brand-400 mt-1">Invite team members using the form above</p>
                  )}
                </div>
              ) : (
                invitations.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between px-6 py-4 hover:bg-amber-50/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                        <Mail size={22} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-brand-900">{invite.email}</div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs text-brand-500">
                            <Clock size={12} />
                            Sent {new Date(invite.created_at).toLocaleDateString()}
                          </span>
                          <span
                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${getRoleBadgeStyle(invite.role)}`}
                          >
                            {getRoleIcon(invite.role)}
                            {getRoleLabel(invite.role)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => resendInvitation(invite.id)}
                          disabled={actionLoading === invite.id}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-colors border border-transparent hover:border-brand-200"
                        >
                          {actionLoading === invite.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                          Resend
                        </button>
                        <button
                          onClick={() => cancelInvitation(invite.id)}
                          disabled={actionLoading === invite.id}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                        >
                          <X className="h-3.5 w-3.5" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
