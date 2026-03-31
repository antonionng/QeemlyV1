"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminInboxPageContent } from "@/app/admin/(dashboard)/inbox/page";
import { AdminRunsPageContent } from "@/app/admin/(dashboard)/runs/page";
import { SourcesPageContent } from "@/app/admin/(dashboard)/sources/page";
import { IntakeRecentActivityContent } from "@/components/admin/intake-recent-activity";
import { fetchAdminJson } from "@/lib/admin/api-client";
import { type AdminInboxUpload } from "@/lib/admin/inbox";

type IntakeSource = {
  id: string;
};

type IntakeJob = {
  id: string;
};

type IntakeTabId = "manual" | "automated" | "activity";

const INTAKE_TABS: Array<{
  id: IntakeTabId;
  label: string;
  description: string;
}> = [
  {
    id: "manual",
    label: "Manual Uploads",
    description: "Upload and review shared-market research files before they become live benchmark data.",
  },
  {
    id: "automated",
    label: "Automated Sources",
    description: "Enable feeds and trigger approved automation without leaving the intake workflow.",
  },
  {
    id: "activity",
    label: "Recent Activity",
    description: "Review manual uploads separately from automated ingestion jobs.",
  },
];

export default function AdminIntakePage() {
  const [activeTab, setActiveTab] = useState<IntakeTabId>("manual");
  const [manualUploadCount, setManualUploadCount] = useState(0);
  const [automatedSourceCount, setAutomatedSourceCount] = useState(0);
  const [recentActivityCount, setRecentActivityCount] = useState(0);
  const activeTabConfig = INTAKE_TABS.find((tab) => tab.id === activeTab) ?? INTAKE_TABS[0];
  const tabCounts = useMemo(
    () => ({
      manual: manualUploadCount,
      automated: automatedSourceCount,
      activity: recentActivityCount,
    }),
    [automatedSourceCount, manualUploadCount, recentActivityCount],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadTabCounts() {
      try {
        const [uploads, sources, jobs] = await Promise.all([
          fetchAdminJson<AdminInboxUpload[]>("/api/admin/inbox"),
          fetchAdminJson<IntakeSource[]>("/api/admin/sources"),
          fetchAdminJson<IntakeJob[]>("/api/admin/jobs"),
        ]);

        if (!isMounted) return;
        const uploadCount = Array.isArray(uploads) ? uploads.length : 0;
        const sourceCount = Array.isArray(sources) ? sources.length : 0;
        const jobCount = Array.isArray(jobs) ? jobs.length : 0;

        setManualUploadCount(uploadCount);
        setAutomatedSourceCount(sourceCount);
        setRecentActivityCount(uploadCount + jobCount);
      } catch {
        if (!isMounted) return;
        setManualUploadCount(0);
        setAutomatedSourceCount(0);
        setRecentActivityCount(0);
      }
    }

    void loadTabCounts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Data Intake</h1>
        <p className="page-subtitle">
          Manage manual research uploads, automated source operations, and recent ingestion activity in one place.
        </p>
      </div>

      <div
        data-testid="intake-tab-bar"
        className="sticky top-4 z-10 flex flex-wrap gap-3 rounded-2xl border border-border bg-background/95 py-2 backdrop-blur"
      >
        {INTAKE_TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-brand-500 text-white"
                  : "border border-border bg-surface-1 text-text-secondary hover:bg-surface-2"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${isActive ? "bg-white/20" : "bg-surface-2"}`}>
                {tabCounts[tab.id]}
              </span>
            </button>
          );
        })}
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="section-header">{activeTabConfig.label}</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {activeTabConfig.description}
          </p>
        </div>
        {activeTab === "manual" ? <AdminInboxPageContent embedded /> : null}
        {activeTab === "automated" ? (
          <div className="space-y-8">
            <SourcesPageContent embedded />
            <AdminRunsPageContent embedded showRecentRuns={false} />
          </div>
        ) : null}
        {activeTab === "activity" ? <IntakeRecentActivityContent /> : null}
      </section>
    </div>
  );
}
