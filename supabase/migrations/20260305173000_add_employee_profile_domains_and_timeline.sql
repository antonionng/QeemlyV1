-- Employee profile domains for compensation-focused profile pages.

CREATE TABLE IF NOT EXISTS employee_profile_enrichment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  avatar_url TEXT,
  avatar_source TEXT NOT NULL DEFAULT 'manual' CHECK (avatar_source IN ('manual', 'hris', 'ats', 'upload')),
  external_hris_id TEXT,
  external_ats_id TEXT,
  legal_name TEXT,
  preferred_name TEXT,
  manager_name TEXT,
  national_id TEXT,
  source_system TEXT,
  source_updated_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id)
);

CREATE TABLE IF NOT EXISTS employee_contribution_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AED',
  employer_pension_amount NUMERIC NOT NULL DEFAULT 0,
  employer_pension_pct NUMERIC,
  employee_pension_amount NUMERIC NOT NULL DEFAULT 0,
  employee_pension_pct NUMERIC,
  social_insurance_amount NUMERIC NOT NULL DEFAULT 0,
  social_insurance_pct NUMERIC,
  housing_allowance_amount NUMERIC NOT NULL DEFAULT 0,
  transport_allowance_amount NUMERIC NOT NULL DEFAULT 0,
  other_contribution_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  source_system TEXT,
  source_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, effective_date, source_reference)
);

CREATE TABLE IF NOT EXISTS equity_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  grant_type TEXT NOT NULL DEFAULT 'option' CHECK (grant_type IN ('option', 'rsu', 'phantom', 'other')),
  grant_date DATE NOT NULL DEFAULT CURRENT_DATE,
  vesting_start_date DATE,
  cliff_months INTEGER NOT NULL DEFAULT 12,
  vesting_months INTEGER NOT NULL DEFAULT 48,
  total_units NUMERIC NOT NULL DEFAULT 0,
  vested_units NUMERIC NOT NULL DEFAULT 0,
  outstanding_units NUMERIC NOT NULL DEFAULT 0,
  strike_price NUMERIC,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'exercised', 'expired')),
  notes TEXT,
  source_system TEXT,
  source_reference TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_visa_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  visa_type TEXT NOT NULL DEFAULT 'work_permit',
  visa_status TEXT NOT NULL DEFAULT 'active' CHECK (visa_status IN ('active', 'expiring', 'expired', 'pending', 'cancelled')),
  issuing_country TEXT NOT NULL DEFAULT 'UAE',
  sponsor_name TEXT,
  sponsor_type TEXT,
  permit_id TEXT,
  residency_id TEXT,
  issue_date DATE,
  expiry_date DATE,
  renewal_window_days INTEGER NOT NULL DEFAULT 90,
  notes TEXT,
  source_system TEXT,
  source_reference TEXT,
  source_updated_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, permit_id, expiry_date)
);

CREATE TABLE IF NOT EXISTS employee_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'profile_updated',
      'employee_created',
      'compensation_updated',
      'contribution_updated',
      'equity_grant_created',
      'equity_grant_updated',
      'visa_updated',
      'sync_received'
    )
  ),
  actor_type TEXT NOT NULL DEFAULT 'system' CHECK (actor_type IN ('user', 'system', 'hris', 'ats', 'upload', 'api')),
  actor_id TEXT,
  actor_name TEXT,
  source_system TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE employee_profile_enrichment ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_contribution_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE equity_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_visa_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_timeline_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view profile enrichment in workspace" ON employee_profile_enrichment;
CREATE POLICY "Users can view profile enrichment in workspace"
ON employee_profile_enrichment FOR SELECT
USING (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage profile enrichment in workspace" ON employee_profile_enrichment;
CREATE POLICY "Admins can manage profile enrichment in workspace"
ON employee_profile_enrichment FOR ALL
USING (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can view contribution snapshots in workspace" ON employee_contribution_snapshots;
CREATE POLICY "Users can view contribution snapshots in workspace"
ON employee_contribution_snapshots FOR SELECT
USING (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage contribution snapshots in workspace" ON employee_contribution_snapshots;
CREATE POLICY "Admins can manage contribution snapshots in workspace"
ON employee_contribution_snapshots FOR ALL
USING (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can view equity grants in workspace" ON equity_grants;
CREATE POLICY "Users can view equity grants in workspace"
ON equity_grants FOR SELECT
USING (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage equity grants in workspace" ON equity_grants;
CREATE POLICY "Admins can manage equity grants in workspace"
ON equity_grants FOR ALL
USING (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can view visa records in workspace" ON employee_visa_records;
CREATE POLICY "Users can view visa records in workspace"
ON employee_visa_records FOR SELECT
USING (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage visa records in workspace" ON employee_visa_records;
CREATE POLICY "Admins can manage visa records in workspace"
ON employee_visa_records FOR ALL
USING (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can view employee timeline events in workspace" ON employee_timeline_events;
CREATE POLICY "Users can view employee timeline events in workspace"
ON employee_timeline_events FOR SELECT
USING (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage employee timeline events in workspace" ON employee_timeline_events;
CREATE POLICY "Admins can manage employee timeline events in workspace"
ON employee_timeline_events FOR ALL
USING (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE INDEX IF NOT EXISTS idx_employee_profile_enrichment_workspace_employee
  ON employee_profile_enrichment(workspace_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_contribution_snapshots_workspace_employee_date
  ON employee_contribution_snapshots(workspace_id, employee_id, effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_equity_grants_workspace_employee
  ON equity_grants(workspace_id, employee_id, status);
CREATE INDEX IF NOT EXISTS idx_employee_visa_records_workspace_employee_expiry
  ON employee_visa_records(workspace_id, employee_id, expiry_date);
CREATE INDEX IF NOT EXISTS idx_employee_timeline_events_workspace_employee_occurred
  ON employee_timeline_events(workspace_id, employee_id, occurred_at DESC);
