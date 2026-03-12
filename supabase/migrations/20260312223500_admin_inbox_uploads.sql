-- =============================================================================
-- Admin inbox uploads
-- Persists shared-market research assets staged by superadmins.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.admin_market_research_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL CHECK (file_size >= 0),
  mime_type text,
  file_kind text NOT NULL CHECK (file_kind IN ('csv', 'pdf', 'other')),
  ingest_queue text NOT NULL CHECK (
    ingest_queue IN ('Structured import', 'Document review', 'Needs triage')
  ),
  ingestion_status text NOT NULL DEFAULT 'uploaded' CHECK (
    ingestion_status IN ('uploaded', 'ingested', 'reviewing', 'published', 'failed')
  ),
  ingestion_notes text,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_market_research_uploads_created_at_idx
  ON public.admin_market_research_uploads (created_at DESC);

ALTER TABLE public.admin_market_research_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmins manage admin inbox uploads" ON public.admin_market_research_uploads;
CREATE POLICY "Superadmins manage admin inbox uploads"
ON public.admin_market_research_uploads
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

INSERT INTO storage.buckets (id, name, public)
SELECT 'admin-inbox', 'admin-inbox', false
WHERE NOT EXISTS (
  SELECT 1
  FROM storage.buckets
  WHERE id = 'admin-inbox'
);
