CREATE TABLE IF NOT EXISTS raw_source_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES ingestion_sources(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  schema_version TEXT NOT NULL DEFAULT 'v1',
  checksum TEXT NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0,
  storage_path TEXT,
  sample_preview JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE raw_source_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can read raw source snapshots" ON raw_source_snapshots;
CREATE POLICY "Super admins can read raw source snapshots"
ON raw_source_snapshots FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
  )
);

CREATE INDEX IF NOT EXISTS idx_raw_source_snapshots_source
ON raw_source_snapshots(source_id, fetched_at DESC);
