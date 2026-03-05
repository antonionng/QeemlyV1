-- Add database-managed report templates and report run tracking.

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type_id TEXT NOT NULL CHECK (type_id IN ('overview', 'benchmark', 'compliance', 'custom')),
  status TEXT DEFAULT 'Building' CHECK (status IN ('Scheduled', 'Ready', 'In Review', 'Building')),
  owner TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  schedule_cadence TEXT CHECK (schedule_cadence IN ('once', 'daily', 'weekly', 'monthly', 'quarterly')),
  schedule_next_run TIMESTAMPTZ,
  recipients TEXT[] DEFAULT '{}',
  config JSONB DEFAULT '{}',
  result_data JSONB,
  format TEXT DEFAULT 'PDF' CHECK (format IN ('PDF', 'XLSX', 'Slides')),
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their workspace reports" ON reports;
CREATE POLICY "Users can view their workspace reports"
ON reports FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert workspace reports" ON reports;
CREATE POLICY "Users can insert workspace reports"
ON reports FOR INSERT
WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update workspace reports" ON reports;
CREATE POLICY "Users can update workspace reports"
ON reports FOR UPDATE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete workspace reports" ON reports;
CREATE POLICY "Users can delete workspace reports"
ON reports FOR DELETE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_reports_workspace ON reports(workspace_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type_id);

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS template_id UUID,
  ADD COLUMN IF NOT EXISTS template_version INTEGER,
  ADD COLUMN IF NOT EXISTS last_run_id UUID,
  ADD COLUMN IF NOT EXISTS build_error TEXT;

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  type_id TEXT NOT NULL CHECK (type_id IN ('overview', 'benchmark', 'compliance', 'custom')),
  category TEXT DEFAULT 'all',
  description TEXT DEFAULT '',
  cadence TEXT DEFAULT 'On Demand',
  coverage TEXT DEFAULT 'All roles',
  confidence TEXT DEFAULT 'Medium' CHECK (confidence IN ('High', 'Medium', 'Low')),
  owner TEXT DEFAULT 'People Analytics',
  tags TEXT[] DEFAULT '{}',
  config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view workspace and global report templates" ON report_templates;
CREATE POLICY "Users can view workspace and global report templates"
ON report_templates FOR SELECT
USING (
  workspace_id IS NULL
  OR workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert workspace report templates" ON report_templates;
CREATE POLICY "Users can insert workspace report templates"
ON report_templates FOR INSERT
WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update workspace report templates" ON report_templates;
CREATE POLICY "Users can update workspace report templates"
ON report_templates FOR UPDATE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete workspace report templates" ON report_templates;
CREATE POLICY "Users can delete workspace report templates"
ON report_templates FOR DELETE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE UNIQUE INDEX IF NOT EXISTS idx_report_templates_global_slug_version
  ON report_templates(slug, version)
  WHERE workspace_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_report_templates_workspace_slug_version
  ON report_templates(workspace_id, slug, version)
  WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_report_templates_workspace_active
  ON report_templates(workspace_id, is_active, type_id);

CREATE TABLE IF NOT EXISTS report_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'success', 'failed')),
  triggered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  trigger_source TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_source IN ('manual', 'schedule', 'api', 'template')),
  attempt_number INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  result_data JSONB,
  artifact_url TEXT,
  artifact_format TEXT CHECK (artifact_format IN ('PDF', 'XLSX', 'Slides')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE report_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view workspace report runs" ON report_runs;
CREATE POLICY "Users can view workspace report runs"
ON report_runs FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert workspace report runs" ON report_runs;
CREATE POLICY "Users can insert workspace report runs"
ON report_runs FOR INSERT
WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update workspace report runs" ON report_runs;
CREATE POLICY "Users can update workspace report runs"
ON report_runs FOR UPDATE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete workspace report runs" ON report_runs;
CREATE POLICY "Users can delete workspace report runs"
ON report_runs FOR DELETE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_report_runs_report_created
  ON report_runs(report_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_runs_workspace_status
  ON report_runs(workspace_id, status, created_at DESC);

ALTER TABLE reports
  DROP CONSTRAINT IF EXISTS reports_template_id_fkey,
  ADD CONSTRAINT reports_template_id_fkey
  FOREIGN KEY (template_id) REFERENCES report_templates(id) ON DELETE SET NULL;

ALTER TABLE reports
  DROP CONSTRAINT IF EXISTS reports_last_run_id_fkey,
  ADD CONSTRAINT reports_last_run_id_fkey
  FOREIGN KEY (last_run_id) REFERENCES report_runs(id) ON DELETE SET NULL;
