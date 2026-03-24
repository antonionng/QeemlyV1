export type AdminInboxFileKind = "csv" | "pdf" | "other";

export type AdminInboxQueue =
  | "Structured import"
  | "Document review"
  | "Needs triage";

export type AdminInboxStatus =
  | "uploaded"
  | "ingested"
  | "reviewing"
  | "published"
  | "failed";

export type AdminInboxPdfReviewStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "ingested";

export type AdminInboxUpload = {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string | null;
  file_kind: AdminInboxFileKind;
  ingest_queue: AdminInboxQueue;
  ingestion_status: AdminInboxStatus;
  ingestion_notes: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at?: string;
};

export type AdminInboxPdfRow = {
  id: string;
  upload_id: string;
  row_index: number;
  source_family: string;
  raw_text: string;
  role_title: string;
  function_name: string | null;
  employment_type: string | null;
  pay_period: "monthly" | "annual";
  currency: string;
  location_hint: string;
  level_hint: string;
  salary_2025_min: number;
  salary_2025_max: number;
  salary_2026_min: number;
  salary_2026_max: number;
  parse_confidence: "high" | "medium" | "low";
  review_status: AdminInboxPdfReviewStatus;
  review_notes: string | null;
  created_at?: string;
  updated_at?: string;
};

export function summarizeAdminInboxUploads(uploads: AdminInboxUpload[]) {
  return uploads.reduce(
    (acc, upload) => {
      if (upload.ingest_queue === "Structured import") acc.queue.structured += 1;
      else if (upload.ingest_queue === "Document review") acc.queue.documents += 1;
      else acc.queue.triage += 1;

      if (upload.ingestion_status === "uploaded") acc.status.uploaded += 1;
      else if (upload.ingestion_status === "ingested") acc.status.ingested += 1;
      else if (upload.ingestion_status === "failed") acc.status.failed += 1;
      else if (upload.ingestion_status === "published") acc.status.published += 1;
      else acc.status.reviewing += 1;

      return acc;
    },
    {
      queue: { structured: 0, documents: 0, triage: 0 },
      status: { uploaded: 0, ingested: 0, reviewing: 0, published: 0, failed: 0 },
    },
  );
}
