"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  ChevronDown,
  Check,
  Loader2,
  Eye,
  X,
  ShieldAlert,
} from "lucide-react";
import { getCompanyInitials, useCompanySettings } from "@/lib/company";

type Workspace = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  collapsed?: boolean;
};

export function WorkspaceSwitcher({ collapsed = false }: Props) {
  const router = useRouter();
  const companySettings = useCompanySettings();
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [open, setOpen] = useState(false);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [overrideWorkspace, setOverrideWorkspace] = useState<Workspace | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const loadWorkspaces = useCallback(async () => {
    try {
      const [listRes, overrideRes, settingsRes] = await Promise.all([
        fetch("/api/admin/workspaces/list"),
        fetch("/api/admin/workspace-override"),
        fetch("/api/settings"),
      ]);

      if (listRes.ok) {
        const listData = await listRes.json();
        setWorkspaces(listData.workspaces || []);
        setCurrentWorkspaceId(listData.current_workspace_id);
        setIsSuperAdmin(listData.is_super_admin);
      }

      if (overrideRes.ok) {
        const overrideData = await overrideRes.json();
        if (overrideData.is_overriding && overrideData.workspace) {
          setOverrideWorkspace(overrideData.workspace);
        }
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        const workspaceId = settingsData.workspace_id || null;
        const workspaceName = settingsData.workspace_name || null;
        const workspaceSlug = settingsData.workspace_slug || "";

        if (workspaceId) {
          setCurrentWorkspaceId((prev) => prev || workspaceId);
        }

        if (workspaceId && workspaceName) {
          setCurrentWorkspace({
            id: workspaceId,
            name: workspaceName,
            slug: workspaceSlug,
          });
        }
      }
    } catch {
      // Not a super admin or error - hide switcher
      setIsSuperAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  const switchWorkspace = async (workspace: Workspace) => {
    setSwitching(true);
    try {
      const res = await fetch("/api/admin/workspace-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspace.id }),
      });

      if (res.ok) {
        setOverrideWorkspace(workspace);
        setOpen(false);
        router.refresh();
      }
    } finally {
      setSwitching(false);
    }
  };

  const clearOverride = async () => {
    setSwitching(true);
    try {
      const res = await fetch("/api/admin/workspace-override", {
        method: "DELETE",
      });

      if (res.ok) {
        setOverrideWorkspace(null);
        setOpen(false);
        router.refresh();
      }
    } finally {
      setSwitching(false);
    }
  };

  useEffect(() => {
    setLogoLoadFailed(false);
  }, [companySettings.companyLogo]);

  // Don't render if not super admin or still loading
  if (loading || !isSuperAdmin) {
    return null;
  }

  const activeWorkspace =
    overrideWorkspace ||
    workspaces.find((w) => w.id === currentWorkspaceId) ||
    currentWorkspace;
  const isOverriding = !!overrideWorkspace;
  const companyInitials = getCompanyInitials(companySettings.companyName || activeWorkspace?.name || "Workspace");
  const hasCompanyLogo = !!companySettings.companyLogo && !logoLoadFailed;

  if (collapsed) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
            isOverriding
              ? "bg-amber-100 text-amber-700 ring-2 ring-amber-300"
              : "bg-brand-100 text-brand-700 hover:bg-brand-200"
          }`}
          title={activeWorkspace?.name || "Switch Workspace"}
        >
          {hasCompanyLogo ? (
            <img
              src={companySettings.companyLogo!}
              alt={companySettings.companyName || activeWorkspace?.name || "Workspace"}
              className="h-6 w-6 rounded-md object-contain"
              onError={() => setLogoLoadFailed(true)}
            />
          ) : (
            <span className="text-xs font-semibold">{companyInitials}</span>
          )}
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute left-full top-0 ml-2 z-50 w-64 bg-white rounded-xl shadow-xl border border-border overflow-hidden">
              <div className="px-3 py-2 bg-brand-50 border-b border-border">
                <div className="flex items-center gap-2 text-xs font-medium text-brand-700">
                  <ShieldAlert className="h-3 w-3" />
                  Super Admin View
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => switchWorkspace(ws)}
                    disabled={switching}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-brand-50 transition-colors text-left"
                  >
                    <Building2 className="h-4 w-4 text-brand-400 flex-shrink-0" />
                    <span className="truncate flex-1">{ws.name}</span>
                    {ws.id === activeWorkspace?.id && <Check className="h-4 w-4 text-brand-500" />}
                  </button>
                ))}
              </div>
              {isOverriding && (
                <div className="px-3 py-2 border-t border-border bg-amber-50">
                  <button
                    onClick={clearOverride}
                    disabled={switching}
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Return to My Workspace
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={switching}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-left ${
          isOverriding
            ? "bg-amber-50 border-2 border-amber-300 text-amber-800"
            : "bg-brand-50 border border-brand-200 text-brand-800 hover:bg-brand-100"
        }`}
      >
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${
            isOverriding ? "bg-amber-100 text-amber-700" : "bg-brand-100 text-brand-700"
          }`}
        >
          {switching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : hasCompanyLogo ? (
            <img
              src={companySettings.companyLogo!}
              alt={companySettings.companyName || activeWorkspace?.name || "Workspace"}
              className="h-6 w-6 rounded-md object-contain"
              onError={() => setLogoLoadFailed(true)}
            />
          ) : (
            <span className="text-xs font-semibold">{companyInitials}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate">
            {isOverriding ? "Viewing as" : "Workspace"}
          </div>
          <div className="text-sm font-semibold truncate">{activeWorkspace?.name || "Select"}</div>
        </div>
        {isOverriding && <Eye className="h-4 w-4 flex-shrink-0 text-amber-700" />}
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-border overflow-hidden">
            <div className="px-3 py-2 bg-gradient-to-r from-brand-50 to-purple-50 border-b border-border">
              <div className="flex items-center gap-2 text-xs font-medium text-brand-700">
                <ShieldAlert className="h-3 w-3" />
                Super Admin: Switch Workspace
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => switchWorkspace(ws)}
                  disabled={switching}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-brand-50 transition-colors text-left ${
                    ws.id === activeWorkspace?.id ? "bg-brand-50" : ""
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-600 flex-shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-brand-900 truncate">{ws.name}</div>
                    <div className="text-xs text-brand-500 truncate">{ws.slug}</div>
                  </div>
                  {ws.id === activeWorkspace?.id && (
                    <Check className="h-4 w-4 text-brand-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
            {isOverriding && (
              <div className="px-3 py-2 border-t border-border bg-amber-50">
                <button
                  onClick={clearOverride}
                  disabled={switching}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                  Return to My Workspace
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
