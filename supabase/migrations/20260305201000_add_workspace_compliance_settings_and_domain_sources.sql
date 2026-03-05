-- Tenant-level compliance setup configuration + data source metadata.

CREATE TABLE IF NOT EXISTS workspace_compliance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
  prefer_integration_data BOOLEAN NOT NULL DEFAULT true,
  prefer_import_data BOOLEAN NOT NULL DEFAULT true,
  allow_manual_overrides BOOLEAN NOT NULL DEFAULT true,
  default_jurisdictions TEXT[] NOT NULL DEFAULT ARRAY['UAE'],
  visa_lead_time_days INTEGER NOT NULL DEFAULT 30 CHECK (visa_lead_time_days >= 0 AND visa_lead_time_days <= 365),
  deadline_sla_days INTEGER NOT NULL DEFAULT 14 CHECK (deadline_sla_days >= 1 AND deadline_sla_days <= 365),
  document_renewal_threshold_days INTEGER NOT NULL DEFAULT 45 CHECK (document_renewal_threshold_days >= 1 AND document_renewal_threshold_days <= 365),
  risk_weights JSONB NOT NULL DEFAULT '{"benchmarkCoverage":0.2,"outOfBand":0.25,"policyCompletion":0.2,"documents":0.1,"visa":0.15,"deadlines":0.1}'::jsonb,
  is_compliance_configured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE workspace_compliance_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view compliance settings in workspace" ON workspace_compliance_settings;
CREATE POLICY "Users can view compliance settings in workspace"
ON workspace_compliance_settings FOR SELECT
USING (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage compliance settings in workspace" ON workspace_compliance_settings;
CREATE POLICY "Admins can manage compliance settings in workspace"
ON workspace_compliance_settings FOR ALL
USING (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE INDEX IF NOT EXISTS idx_workspace_compliance_settings_workspace
  ON workspace_compliance_settings(workspace_id);

ALTER TABLE compliance_policies
  ADD COLUMN IF NOT EXISTS data_source TEXT NOT NULL DEFAULT 'manual'
  CHECK (data_source IN ('integration', 'import', 'manual', 'seed')),
  ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE compliance_regulatory_updates
  ADD COLUMN IF NOT EXISTS data_source TEXT NOT NULL DEFAULT 'manual'
  CHECK (data_source IN ('integration', 'import', 'manual', 'seed')),
  ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE compliance_deadlines
  ADD COLUMN IF NOT EXISTS data_source TEXT NOT NULL DEFAULT 'manual'
  CHECK (data_source IN ('integration', 'import', 'manual', 'seed')),
  ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE compliance_visa_cases
  ADD COLUMN IF NOT EXISTS data_source TEXT NOT NULL DEFAULT 'manual'
  CHECK (data_source IN ('integration', 'import', 'manual', 'seed')),
  ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE compliance_documents
  ADD COLUMN IF NOT EXISTS data_source TEXT NOT NULL DEFAULT 'manual'
  CHECK (data_source IN ('integration', 'import', 'manual', 'seed')),
  ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE compliance_audit_events
  ADD COLUMN IF NOT EXISTS data_source TEXT NOT NULL DEFAULT 'manual'
  CHECK (data_source IN ('integration', 'import', 'manual', 'seed')),
  ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_compliance_policies_source
  ON compliance_policies(workspace_id, data_source, source_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_regulatory_updates_source
  ON compliance_regulatory_updates(workspace_id, data_source, source_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_deadlines_source
  ON compliance_deadlines(workspace_id, data_source, source_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_visa_cases_source
  ON compliance_visa_cases(workspace_id, data_source, source_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_source
  ON compliance_documents(workspace_id, data_source, source_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_events_source
  ON compliance_audit_events(workspace_id, data_source, source_updated_at DESC);
