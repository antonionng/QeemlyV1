"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminPageError } from "@/components/admin/admin-page-error";
import { Card } from "@/components/ui/card";
import { fetchAdminJson, normalizeAdminApiError, type NormalizedAdminApiError } from "@/lib/admin/api-client";
import {
  summarizeAdminInboxUploads,
  type AdminInboxPdfRow,
  type AdminInboxPdfReviewStatus,
  type AdminInboxStatus,
  type AdminInboxUpload,
} from "@/lib/admin/inbox";
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

function formatMoneyRange(currency: string, min: number, max: number) {
  return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
}

function buildInitialRowEdits(rows: AdminInboxPdfRow[]) {
  return Object.fromEntries(
    rows.map((row) => [
      row.id,
      {
        role_title: row.role_title,
        location_hint: row.location_hint,
        level_hint: row.level_hint,
        review_notes: row.review_notes ?? "",
      },
    ]),
  );
}

export default function AdminInboxPage() {
  const [uploads, setUploads] = useState<AdminInboxUpload[]>([]);
  const [pdfRows, setPdfRows] = useState<AdminInboxPdfRow[]>([]);
  const [selectedPdfUploadId, setSelectedPdfUploadId] = useState<string | null>(null);
  const [loadingPdfRows, setLoadingPdfRows] = useState(false);
  const [extractingUploadId, setExtractingUploadId] = useState<string | null>(null);
  const [savingPdfRowId, setSavingPdfRowId] = useState<string | null>(null);
  const [bulkUpdatingUploadId, setBulkUpdatingUploadId] = useState<string | null>(null);
  const [ingestingUploadId, setIngestingUploadId] = useState<string | null>(null);
  const [pdfRowEdits, setPdfRowEdits] = useState<
    Record<string, { role_title: string; location_hint: string; level_hint: string; review_notes: string }>
  >({});
  const [pendingAssets, setPendingAssets] = useState<PendingAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<NormalizedAdminApiError | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
    details?: string[];
  } | null>(null);
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
  const selectedPdfUpload = useMemo(
    () => uploads.find((upload) => upload.id === selectedPdfUploadId) ?? null,
    [selectedPdfUploadId, uploads],
  );
  const approvedPdfRowCount = pdfRows.filter((row) => row.review_status === "approved").length;
  const pendingPdfRowCount = pdfRows.filter((row) => row.review_status === "pending").length;

  const loadPdfRows = async (uploadId: string) => {
    setSelectedPdfUploadId(uploadId);
    setLoadingPdfRows(true);
    setMessage(null);
    try {
      const payload = await fetchAdminJson<AdminInboxPdfRow[]>(`/api/admin/inbox/${uploadId}/rows`);
      const nextRows = Array.isArray(payload) ? payload : [];
      setPdfRows(nextRows);
      setPdfRowEdits(buildInitialRowEdits(nextRows));
    } catch (err) {
      setPdfRows([]);
      setPdfRowEdits({});
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to load extracted PDF rows.",
      });
    } finally {
      setLoadingPdfRows(false);
    }
  };

  const extractPdfRows = async (uploadId: string) => {
    setExtractingUploadId(uploadId);
    setMessage(null);
    try {
      const payload = await fetchAdminJson<{ extractedCount: number }>(
        `/api/admin/inbox/${uploadId}/extract`,
        { method: "POST" },
      );
      await loadUploads();
      await loadPdfRows(uploadId);
      setMessage({
        type: "success",
        text: `${payload.extractedCount} PDF row${payload.extractedCount === 1 ? "" : "s"} extracted for review.`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to extract PDF rows.",
      });
    } finally {
      setExtractingUploadId(null);
    }
  };

  const updatePdfRow = async (
    uploadId: string,
    rowId: string,
    reviewStatus: AdminInboxPdfReviewStatus,
  ) => {
    const edits = pdfRowEdits[rowId];
    if (!edits) return;

    setSavingPdfRowId(rowId);
    setMessage(null);
    try {
      const updatedRow = await fetchAdminJson<AdminInboxPdfRow>(`/api/admin/inbox/${uploadId}/rows`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowId,
          changes: {
            ...edits,
            review_status: reviewStatus,
            review_notes: edits.review_notes || null,
          },
        }),
      });
      setPdfRows((current) => current.map((row) => (row.id === rowId ? updatedRow : row)));
      setMessage({
        type: "success",
        text: `PDF row marked ${reviewStatus}.`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update PDF row review status.",
      });
    } finally {
      setSavingPdfRowId(null);
    }
  };

  const bulkUpdatePdfRows = async (
    uploadId: string,
    rowIds: string[],
    reviewStatus: AdminInboxPdfReviewStatus,
  ) => {
    if (rowIds.length === 0) return;

    setBulkUpdatingUploadId(uploadId);
    setMessage(null);
    try {
      const updatedRows = await fetchAdminJson<AdminInboxPdfRow[]>(`/api/admin/inbox/${uploadId}/rows`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowIds,
          changes: {
            review_status: reviewStatus,
          },
        }),
      });
      const updatedRowMap = new Map(updatedRows.map((row) => [row.id, row]));
      setPdfRows((current) => current.map((row) => updatedRowMap.get(row.id) ?? row));
      setMessage({
        type: "success",
        text: `${updatedRows.length} PDF row${updatedRows.length === 1 ? "" : "s"} marked ${reviewStatus}.`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update PDF row review status.",
      });
    } finally {
      setBulkUpdatingUploadId(null);
    }
  };

  const ingestApprovedPdfRows = async (uploadId: string) => {
    setIngestingUploadId(uploadId);
    setMessage(null);
    try {
      const payload = await fetchAdminJson<{
        ingestedCount: number;
        failedCount: number;
        failures?: string[];
      }>(`/api/admin/inbox/${uploadId}/ingest`, {
        method: "POST",
      });
      await loadUploads();
      await loadPdfRows(uploadId);
      setMessage({
        type: payload.failedCount > 0 ? "error" : "success",
        text:
          payload.failedCount > 0
            ? `${payload.ingestedCount} approved PDF row${
                payload.ingestedCount === 1 ? "" : "s"
              } moved into market staging. ${payload.failedCount} approved row${
                payload.failedCount === 1 ? "" : "s"
              } still need fixes.`
            : `${payload.ingestedCount} approved PDF row${
                payload.ingestedCount === 1 ? "" : "s"
              } moved into market staging.`,
        details: payload.failedCount > 0 ? payload.failures ?? [] : undefined,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to ingest approved PDF rows.",
      });
    } finally {
      setIngestingUploadId(null);
    }
  };

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
          <div className="flex items-start gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <div>
              <p>{message.text}</p>
              {message.details && message.details.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs font-medium">
                  {message.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
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
                <th className="table-head px-5 py-3 text-left">Actions</th>
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
                  <td className="px-5 py-3">
                    {upload.file_kind === "pdf" ? (
                      <div className="flex flex-wrap gap-2">
                        {upload.ingestion_status === "uploaded" ? (
                          <button
                            onClick={() => void extractPdfRows(upload.id)}
                            disabled={extractingUploadId === upload.id}
                            className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
                          >
                            {extractingUploadId === upload.id ? "Extracting..." : "Extract Pilot Rows"}
                          </button>
                        ) : null}
                        {upload.ingestion_status !== "uploaded" ? (
                          <>
                            <button
                              onClick={() => void loadPdfRows(upload.id)}
                              disabled={loadingPdfRows && selectedPdfUploadId === upload.id}
                              className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
                            >
                              {loadingPdfRows && selectedPdfUploadId === upload.id ? "Loading..." : "Review Pilot Rows"}
                            </button>
                            <button
                              onClick={() => void extractPdfRows(upload.id)}
                              disabled={extractingUploadId === upload.id}
                              className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
                            >
                              {extractingUploadId === upload.id ? "Extracting..." : "Re-extract Pilot Rows"}
                            </button>
                          </>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs text-text-tertiary">No manual action</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {selectedPdfUpload ? (
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="section-header">Pilot PDF Review</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Review Robert Walters extracted rows before they enter shared market staging.
              </p>
              <p className="mt-1 text-xs text-text-tertiary">{selectedPdfUpload.file_name}</p>
              <p className="mt-1 text-xs text-text-tertiary">
                After ingestion, finish the operator workflow in{" "}
                <Link href="/admin/publish" className="text-brand-600 underline">
                  Publish
                </Link>
                .
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void extractPdfRows(selectedPdfUpload.id)}
                disabled={extractingUploadId === selectedPdfUpload.id}
                className="rounded-lg border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
              >
                {extractingUploadId === selectedPdfUpload.id ? "Extracting..." : "Re-extract Pilot Rows"}
              </button>
              {pendingPdfRowCount > 0 ? (
                <button
                  onClick={() =>
                    void bulkUpdatePdfRows(
                      selectedPdfUpload.id,
                      pdfRows.filter((row) => row.review_status === "pending").map((row) => row.id),
                      "approved",
                    )
                  }
                  disabled={bulkUpdatingUploadId === selectedPdfUpload.id}
                  className="rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                >
                  {bulkUpdatingUploadId === selectedPdfUpload.id ? "Saving..." : "Approve All Pending"}
                </button>
              ) : null}
              {approvedPdfRowCount > 0 ? (
                <button
                  onClick={() => void ingestApprovedPdfRows(selectedPdfUpload.id)}
                  disabled={ingestingUploadId === selectedPdfUpload.id}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {ingestingUploadId === selectedPdfUpload.id ? "Ingesting..." : "Ingest Approved Rows"}
                </button>
              ) : null}
            </div>
          </div>

          {loadingPdfRows ? (
            <div className="mt-6 flex items-center gap-2 text-sm text-text-secondary">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading extracted rows...
            </div>
          ) : pdfRows.length === 0 ? (
            <div className="mt-6 rounded-xl border border-border bg-surface-2 p-4 text-sm text-text-secondary">
              No extracted rows are available for this PDF yet.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {pdfRows.map((row) => {
                const edits = pdfRowEdits[row.id] ?? {
                  role_title: row.role_title,
                  location_hint: row.location_hint,
                  level_hint: row.level_hint,
                  review_notes: row.review_notes ?? "",
                };

                return (
                  <div key={row.id} className="rounded-2xl border border-border bg-surface-2 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{edits.role_title}</p>
                        <p className="mt-1 text-xs text-text-tertiary">
                          {row.function_name ?? "Unknown function"} · {row.employment_type ?? "Unknown type"} ·{" "}
                          {row.pay_period}
                        </p>
                      </div>
                      <PdfReviewStatusBadge status={row.review_status} />
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-3">
                      <label className="text-xs text-text-secondary">
                        Role title
                        <input
                          value={edits.role_title}
                          onChange={(event) =>
                            setPdfRowEdits((current) => ({
                              ...current,
                              [row.id]: { ...edits, role_title: event.target.value },
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary"
                        />
                      </label>
                      <label className="text-xs text-text-secondary">
                        Location
                        <input
                          value={edits.location_hint}
                          onChange={(event) =>
                            setPdfRowEdits((current) => ({
                              ...current,
                              [row.id]: { ...edits, location_hint: event.target.value },
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary"
                        />
                      </label>
                      <label className="text-xs text-text-secondary">
                        Level
                        <input
                          value={edits.level_hint}
                          onChange={(event) =>
                            setPdfRowEdits((current) => ({
                              ...current,
                              [row.id]: { ...edits, level_hint: event.target.value },
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary"
                        />
                      </label>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-border bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-text-tertiary">2025 range</p>
                        <p className="mt-1 text-sm font-medium text-text-primary">
                          {formatMoneyRange(row.currency, row.salary_2025_min, row.salary_2025_max)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-text-tertiary">2026 range</p>
                        <p className="mt-1 text-sm font-medium text-text-primary">
                          {formatMoneyRange(row.currency, row.salary_2026_min, row.salary_2026_max)}
                        </p>
                      </div>
                    </div>

                    <label className="mt-4 block text-xs text-text-secondary">
                      Review notes
                      <textarea
                        value={edits.review_notes}
                        onChange={(event) =>
                          setPdfRowEdits((current) => ({
                            ...current,
                            [row.id]: { ...edits, review_notes: event.target.value },
                          }))
                        }
                        className="mt-1 min-h-20 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary"
                      />
                    </label>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-text-tertiary">Parse confidence: {row.parse_confidence}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => void updatePdfRow(selectedPdfUpload.id, row.id, "rejected")}
                          disabled={savingPdfRowId === row.id}
                          className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => void updatePdfRow(selectedPdfUpload.id, row.id, "approved")}
                          disabled={savingPdfRowId === row.id}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {savingPdfRowId === row.id ? "Saving..." : "Approve"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      ) : null}
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

function PdfReviewStatusBadge({ status }: { status: AdminInboxPdfReviewStatus }) {
  const classes =
    status === "approved"
      ? "bg-emerald-50 text-emerald-700"
      : status === "rejected"
        ? "bg-rose-50 text-rose-700"
        : status === "ingested"
          ? "bg-blue-50 text-blue-700"
          : "bg-amber-50 text-amber-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${classes}`}>
      {status}
    </span>
  );
}
