"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPageError } from "@/components/admin/admin-page-error";
import { fetchAdminJson, normalizeAdminApiError, type NormalizedAdminApiError } from "@/lib/admin/api-client";
import { type AdminInboxUpload } from "@/lib/admin/inbox";
import { RefreshCw } from "lucide-react";

type Job = {
  id: string;
  status: string;
  source_id: string;
  records_created: number;
  records_updated: number;
  records_failed: number;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
};

type Source = {
  id: string;
  slug: string;
  name: string;
};

function getRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function IntakeRecentActivityContent() {
  const [uploads, setUploads] = useState<AdminInboxUpload[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NormalizedAdminApiError | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [uploadsPayload, jobsPayload, sourcesPayload] = await Promise.all([
        fetchAdminJson<AdminInboxUpload[]>("/api/admin/inbox"),
        fetchAdminJson<Job[]>("/api/admin/jobs"),
        fetchAdminJson<Source[]>("/api/admin/sources"),
      ]);
      setUploads(Array.isArray(uploadsPayload) ? uploadsPayload.slice(0, 10) : []);
      setJobs(Array.isArray(jobsPayload) ? jobsPayload.slice(0, 10) : []);
      setSources(Array.isArray(sourcesPayload) ? sourcesPayload : []);
    } catch (err) {
      setError(normalizeAdminApiError(err));
      setUploads([]);
      setJobs([]);
      setSources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const sourceMap = useMemo(() => new Map(sources.map((source) => [source.id, source])), [sources]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="section-header">Recent Activity</h2>
          <p className="mt-1 text-sm text-text-secondary">
            See manual uploads separately from automated ingestion jobs so queued jobs are not confused with uploaded files.
          </p>
        </div>
        <button
          onClick={() => void loadData()}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface-1 px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-2 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <AdminPageError error={error} onRetry={() => void loadData()} className="mb-6" />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Manual uploads</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{uploads.length}</p>
          <p className="mt-1 text-xs text-text-tertiary">Recent PDFs and CSVs uploaded by operators.</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Automated ingestions</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{jobs.length}</p>
          <p className="mt-1 text-xs text-text-tertiary">Recent shared-market jobs triggered from configured sources.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="section-header">Recent Manual Uploads</h3>
            <span className="text-xs text-text-secondary">Uploaded by an operator</span>
          </div>
          {loading && uploads.length === 0 ? (
            <div className="p-8 text-center">
              <RefreshCw className="mx-auto h-6 w-6 animate-spin text-brand-500" />
            </div>
          ) : uploads.length === 0 ? (
            <div className="p-12 text-center text-sm text-text-tertiary">No manual uploads yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="table-head px-5 py-3 text-left">Asset</th>
                  <th className="table-head px-5 py-3 text-left">Origin</th>
                  <th className="table-head px-5 py-3 text-left">Status</th>
                  <th className="table-head px-5 py-3 text-left">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((upload) => (
                  <tr key={upload.id} className="border-b border-border/50 hover:bg-surface-2">
                    <td className="px-5 py-3">
                      <p className="font-medium text-text-primary">{upload.file_name}</p>
                      <p className="text-xs text-text-tertiary">{upload.ingest_queue}</p>
                    </td>
                    <td className="px-5 py-3 text-text-secondary">Manual upload</td>
                    <td className="px-5 py-3 text-text-secondary">{upload.ingestion_status}</td>
                    <td className="px-5 py-3 text-text-secondary">{getRelativeTime(upload.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="section-header">Automated Ingestion Jobs</h3>
            <span className="text-xs text-text-secondary">Triggered from configured sources</span>
          </div>
          {loading && jobs.length === 0 ? (
            <div className="p-8 text-center">
              <RefreshCw className="mx-auto h-6 w-6 animate-spin text-brand-500" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-12 text-center text-sm text-text-tertiary">No automated ingestion jobs yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="table-head px-5 py-3 text-left">Source</th>
                  <th className="table-head px-5 py-3 text-left">Origin</th>
                  <th className="table-head px-5 py-3 text-left">Status</th>
                  <th className="table-head px-5 py-3 text-left">Started</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const source = sourceMap.get(job.source_id);
                  return (
                    <tr key={job.id} className="border-b border-border/50 hover:bg-surface-2">
                      <td className="px-5 py-3">
                        <p className="font-medium text-text-primary">{source?.name ?? "Unknown source"}</p>
                        <p className="text-xs text-text-tertiary">{source?.slug ?? job.source_id}</p>
                      </td>
                      <td className="px-5 py-3 text-text-secondary">Automated source</td>
                      <td className="px-5 py-3 text-text-secondary">{job.status}</td>
                      <td className="px-5 py-3 text-text-secondary">{getRelativeTime(job.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
