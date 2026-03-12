"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AdminPageError } from "@/components/admin/admin-page-error";
import { Card } from "@/components/ui/card";
import { fetchAdminJson, normalizeAdminApiError, type NormalizedAdminApiError } from "@/lib/admin/api-client";
import { summarizeAdminInboxUploads, type AdminInboxStatus, type AdminInboxUpload } from "@/lib/admin/inbox";
import { classifyResearchAsset } from "@/lib/admin/workbench";
import { AlertCircle, CheckCircle2, FileSpreadsheet, FileText, FolderInput, Loader2, Upload } from "lucide-react";

type PendingAsset = {
  id: string;
  name: string;
  size: number;
  kind: "csv" | "pdf" | "other";
  queue: "Structured import" | "Document review" | "Needs triage";
  file: File;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminInboxPage() {
  const [uploads, setUploads] = useState<AdminInboxUpload[]>([]);
  const [pendingAssets, setPendingAssets] = useState<PendingAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<NormalizedAdminApiError | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const loadUploads = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchAdminJson<AdminInboxUpload[]>("/api/admin/inbox");
      setUploads(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setError(normalizeAdminApiError(err));
      setUploads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUploads();
  }, []);

  const summary = useMemo(() => summarizeAdminInboxUploads(uploads), [uploads]);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const nextAssets = Array.from(fileList).map((file) => {
      const classification = classifyResearchAsset(file.name);
      return {
        id: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        size: file.size,
        kind: classification.kind,
        queue: classification.queue,
        file,
      } satisfies PendingAsset;
    });
    setPendingAssets(nextAssets);
    setMessage(null);
  };

  const uploadPendingAssets = async () => {
    if (pendingAssets.length === 0) return;
    setUploading(true);
    setMessage(null);
    try {
      for (const asset of pendingAssets) {
        const formData = new FormData();
        formData.set("file", asset.file);
        await fetchAdminJson<AdminInboxUpload>("/api/admin/inbox", {
          method: "POST",
          body: formData,
        });
      }

      await loadUploads();
      setPendingAssets([]);
      setMessage({
        type: "success",
        text: `${pendingAssets.length} file${pendingAssets.length === 1 ? "" : "s"} uploaded to Inbox.`,
      });
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to upload files to Inbox.",
      });
    } finally {
      setUploading(false);
    }
  };

  const clearPendingAssets = () => {
    setPendingAssets([]);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageError error={error} onRetry={loadUploads} className="mb-6" />

      <div>
        <h1 className="page-title">Inbox</h1>
        <p className="page-subtitle">
          Stage shared-market research assets before review, normalization, and publish.
        </p>
      </div>

      {message ? (
        <div
          className={`flex items-center gap-2 rounded-xl p-4 text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {message.text}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <FolderInput className="h-5 w-5 text-brand-500" />
            <h2 className="section-header">Manual Intake</h2>
          </div>
          <p className="mt-3 text-sm text-text-secondary">
            Inbox is for shared-market source files only. Tenant company data should continue through tenant upload flows.
          </p>
          <div className="mt-5 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
              <Upload className="h-7 w-7 text-brand-600" />
            </div>
            <p className="mt-4 text-sm font-semibold text-text-primary">Stage CSV, Excel, and PDF research files</p>
            <p className="mt-1 text-xs text-text-tertiary">
              CSV and spreadsheets enter structured import. PDFs enter document review.
            </p>
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              Select Files
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".csv,.xlsx,.xls,.pdf"
              className="hidden"
              onChange={(event) => handleFiles(event.target.files)}
            />
          </div>
          {pendingAssets.length > 0 ? (
            <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-brand-900">Ready to Upload</p>
                  <p className="mt-1 text-xs text-brand-700">
                    Review the selected files, then confirm to add them to the Inbox staging queue.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearPendingAssets}
                    disabled={uploading}
                    className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={() => void uploadPendingAssets()}
                    disabled={uploading}
                    className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                  >
                    {uploading ? "Uploading..." : "Upload to Inbox"}
                  </button>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {pendingAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between rounded-lg border border-brand-100 bg-white px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">{asset.name}</p>
                      <p className="text-xs text-text-tertiary">
                        {asset.queue} · {asset.kind.toUpperCase()} · {formatFileSize(asset.size)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Card>

        <Card className="p-5">
          <h2 className="section-header">Queue Summary</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Structured import</p>
              <p className="mt-2 text-2xl font-bold text-text-primary">{summary.queue.structured}</p>
              <p className="mt-1 text-xs text-text-tertiary">CSV and spreadsheet assets ready for normalization.</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Document review</p>
              <p className="mt-2 text-2xl font-bold text-text-primary">{summary.queue.documents}</p>
              <p className="mt-1 text-xs text-text-tertiary">PDF reports awaiting analyst extraction.</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Needs triage</p>
              <p className="mt-2 text-2xl font-bold text-text-primary">{summary.queue.triage}</p>
              <p className="mt-1 text-xs text-text-tertiary">Unexpected file types that require operator review.</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Uploaded</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{summary.status.uploaded}</p>
          <p className="mt-1 text-xs text-text-tertiary">Files staged and waiting for downstream processing.</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Ingested</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{summary.status.ingested}</p>
          <p className="mt-1 text-xs text-text-tertiary">Files that have completed structured ingestion.</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Reviewing</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {summary.status.reviewing + summary.status.published}
          </p>
          <p className="mt-1 text-xs text-text-tertiary">Manual review or published governance states.</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Failed</p>
          <p className="mt-2 text-2xl font-bold text-rose-600">{summary.status.failed}</p>
          <p className="mt-1 text-xs text-text-tertiary">Uploads or ingestion attempts that need operator attention.</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="section-header">Upload History</h2>
        </div>
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-brand-300" />
            <p className="text-text-secondary">Loading uploads...</p>
          </div>
        ) : uploads.length === 0 ? (
          <div className="p-12 text-center">
            <FolderInput className="mx-auto mb-3 h-10 w-10 text-brand-200" />
            <p className="text-text-secondary">No uploaded research assets yet</p>
            <p className="mt-1 text-xs text-text-tertiary">
              Upload files above to start the shared-market inbox history.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="table-head px-5 py-3 text-left">Asset</th>
                <th className="table-head px-5 py-3 text-left">Queue</th>
                <th className="table-head px-5 py-3 text-left">Status</th>
                <th className="table-head px-5 py-3 text-left">Type</th>
                <th className="table-head px-5 py-3 text-left">Size</th>
                <th className="table-head px-5 py-3 text-left">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((upload) => (
                <tr key={upload.id} className="border-b border-border/50 hover:bg-surface-2">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
                        {upload.file_kind === "pdf" ? <FileText className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{upload.file_name}</p>
                        <p className="text-xs text-text-tertiary">
                          {upload.file_kind === "pdf"
                            ? "Report / salary guide"
                            : upload.file_kind === "csv"
                              ? "Structured data"
                              : "Unclassified asset"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-text-primary">{upload.ingest_queue}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={upload.ingestion_status} />
                  </td>
                  <td className="px-5 py-3 uppercase text-text-secondary">{upload.file_kind}</td>
                  <td className="px-5 py-3 text-text-secondary">{formatFileSize(upload.file_size)}</td>
                  <td className="px-5 py-3">
                    <div className="text-xs text-text-secondary">{new Date(upload.created_at).toLocaleDateString()}</div>
                    {upload.ingestion_notes ? (
                      <div className="mt-1 text-xs text-text-tertiary">{upload.ingestion_notes}</div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: AdminInboxStatus }) {
  const classes =
    status === "uploaded"
      ? "bg-brand-50 text-brand-700"
      : status === "ingested"
        ? "bg-emerald-50 text-emerald-700"
        : status === "failed"
          ? "bg-rose-50 text-rose-700"
          : status === "published"
            ? "bg-blue-50 text-blue-700"
            : "bg-amber-50 text-amber-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${classes}`}>
      {status}
    </span>
  );
}
