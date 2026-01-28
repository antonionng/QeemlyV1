"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  MoreVertical, 
  Loader2, 
  CheckCircle2,
  Clock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownItem,
} from "@/components/ui/dropdown-menu";

export default function TeamPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function getTeamData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*, workspaces(*)")
          .eq("id", user.id)
          .single();

        if (profile) {
          setProfile(profile);
          setWorkspace(profile.workspaces);

          // Fetch team members
          const { data: teamMembers } = await supabase
            .from("profiles")
            .select("*")
            .eq("workspace_id", profile.workspace_id);
          setMembers(teamMembers || []);

          // Fetch pending invitations
          const { data: pendingInvites } = await supabase
            .from("team_invitations")
            .select("*")
            .eq("workspace_id", profile.workspace_id)
            .eq("status", "pending");
          setInvitations(pendingInvites || []);
        }
      }
      setLoading(false);
    }

    getTeamData();
  }, [supabase]);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setMessage(null);

    try {
      if (!inviteEmail) throw new Error("Please enter an email address.");

      const { data, error } = await supabase
        .from("team_invitations")
        .insert({
          workspace_id: profile.workspace_id,
          email: inviteEmail,
          invited_by: user.id,
          status: "pending"
        })
        .select()
        .single();

      if (error) throw error;

      setInvitations([...invitations, data]);
      setInviteEmail("");
      setMessage({ type: "success", text: `Invitation sent to ${inviteEmail}!` });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setInviting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Team Management</h1>
          <p className="text-brand-600">Manage your workspace members and invitations.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-200">
          <Shield size={16} className="text-brand-500" />
          {workspace?.name || "Workspace"}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Invite Form */}
        <Card className="h-fit p-6 lg:col-span-1">
          <div className="mb-6 flex items-center gap-2 text-brand-900">
            <UserPlus size={20} className="text-brand-500" />
            <h2 className="font-bold">Invite Member</h2>
          </div>
          <form onSubmit={sendInvite} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-brand-900">Email Address</label>
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
            {message && (
              <div className={`rounded-lg p-3 text-xs font-medium ${
                message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}>
                {message.text}
              </div>
            )}
            <Button type="submit" fullWidth isLoading={inviting}>
              Send Invitation
            </Button>
          </form>
        </Card>

        {/* Members List */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="border-b border-border/50 bg-brand-50/30 px-6 py-4">
              <h2 className="text-sm font-bold text-brand-900 uppercase tracking-wider">Active Members ({members.length})</h2>
            </div>
            <div className="divide-y divide-border/50">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between px-6 py-4 hover:bg-brand-50/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-xl bg-brand-100 ring-2 ring-white shadow-sm">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.full_name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-brand-400">
                          <Users size={20} />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-brand-900">{member.full_name || "New Member"}</div>
                      <div className="text-xs text-brand-500">{member.role === 'admin' ? 'Administrator' : 'Member'}</div>
                    </div>
                  </div>
                  <DropdownMenu
                    align="right"
                    trigger={
                      <button className="rounded-lg p-1 text-brand-400 hover:bg-brand-50 hover:text-brand-600">
                        <MoreVertical size={18} />
                      </button>
                    }
                  >
                    <DropdownItem>View Profile</DropdownItem>
                    {profile?.role === 'admin' && member.id !== user.id && (
                      <DropdownItem variant="danger">Remove from team</DropdownItem>
                    )}
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </Card>

          {invitations.length > 0 && (
            <Card className="overflow-hidden">
              <div className="border-b border-border/50 bg-brand-50/30 px-6 py-4">
                <h2 className="text-sm font-bold text-brand-900 uppercase tracking-wider">Pending Invitations ({invitations.length})</h2>
              </div>
              <div className="divide-y divide-border/50">
                {invitations.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-400">
                        <Mail size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-brand-900">{invite.email}</div>
                        <div className="flex items-center gap-1 text-xs text-brand-500">
                          <Clock size={12} />
                          Sent {new Date(invite.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Resend
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
