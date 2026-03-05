-- Offer flow persistence
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_name TEXT,
  recipient_email TEXT,
  role_id TEXT NOT NULL,
  level_id TEXT NOT NULL,
  location_id TEXT NOT NULL,
  employment_type TEXT NOT NULL CHECK (employment_type IN ('national', 'expat')),
  target_percentile INTEGER NOT NULL CHECK (target_percentile >= 0 AND target_percentile <= 100),
  offer_value NUMERIC NOT NULL CHECK (offer_value >= 0),
  offer_low NUMERIC NOT NULL CHECK (offer_low >= 0),
  offer_high NUMERIC NOT NULL CHECK (offer_high >= 0),
  currency TEXT NOT NULL,
  salary_breakdown JSONB DEFAULT '{}'::jsonb NOT NULL,
  benchmark_snapshot JSONB DEFAULT '{}'::jsonb NOT NULL,
  export_format TEXT DEFAULT 'PDF' CHECK (export_format IN ('PDF', 'DOCX', 'JSON')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'sent', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT offers_recipient_mode_check CHECK (
    (employee_id IS NOT NULL AND recipient_name IS NULL AND recipient_email IS NULL)
    OR
    (employee_id IS NULL AND recipient_name IS NOT NULL AND recipient_email IS NOT NULL)
  )
);

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their workspace offers" ON offers;
CREATE POLICY "Users can view their workspace offers"
ON offers FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert workspace offers" ON offers;
CREATE POLICY "Users can insert workspace offers"
ON offers FOR INSERT
WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update workspace offers" ON offers;
CREATE POLICY "Users can update workspace offers"
ON offers FOR UPDATE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete workspace offers" ON offers;
CREATE POLICY "Users can delete workspace offers"
ON offers FOR DELETE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_offers_workspace ON offers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_offers_employee ON offers(employee_id);
CREATE INDEX IF NOT EXISTS idx_offers_created_at_desc ON offers(created_at DESC);
