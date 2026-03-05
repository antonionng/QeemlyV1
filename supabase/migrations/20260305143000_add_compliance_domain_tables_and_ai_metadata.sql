-- Normalized compliance domain tables + AI metadata for compliance snapshots.

ALTER TABLE compliance_snapshots
ADD COLUMN IF NOT EXISTS ai_scoring_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS compliance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  completion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Success', 'Pending', 'Critical')),
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compliance_regulatory_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  published_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Active', 'Pending', 'Review')),
  impact TEXT NOT NULL DEFAULT 'Medium' CHECK (impact IN ('High', 'Medium', 'Low')),
  jurisdiction TEXT NOT NULL DEFAULT 'UAE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compliance_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  due_at DATE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Regular' CHECK (type IN ('Urgent', 'Regular', 'Mandatory')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'overdue')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compliance_visa_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expiring', 'overdue', 'open_case')),
  expires_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compliance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'Review' CHECK (status IN ('Active', 'Review', 'Expiring')),
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compliance_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  actor TEXT NOT NULL,
  icon_type TEXT NOT NULL DEFAULT 'risk' CHECK (icon_type IN ('document', 'policy', 'risk', 'user')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  event_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE compliance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_regulatory_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_visa_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view compliance policies in workspace" ON compliance_policies;
CREATE POLICY "Users can view compliance policies in workspace"
ON compliance_policies FOR SELECT
USING (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage compliance policies in workspace" ON compliance_policies;
CREATE POLICY "Admins can manage compliance policies in workspace"
ON compliance_policies FOR ALL
USING (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can view compliance regulatory updates in workspace" ON compliance_regulatory_updates;
CREATE POLICY "Users can view compliance regulatory updates in workspace"
ON compliance_regulatory_updates FOR SELECT
USING (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage compliance regulatory updates in workspace" ON compliance_regulatory_updates;
CREATE POLICY "Admins can manage compliance regulatory updates in workspace"
ON compliance_regulatory_updates FOR ALL
USING (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can view compliance deadlines in workspace" ON compliance_deadlines;
CREATE POLICY "Users can view compliance deadlines in workspace"
ON compliance_deadlines FOR SELECT
USING (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage compliance deadlines in workspace" ON compliance_deadlines;
CREATE POLICY "Admins can manage compliance deadlines in workspace"
ON compliance_deadlines FOR ALL
USING (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can view compliance visa cases in workspace" ON compliance_visa_cases;
CREATE POLICY "Users can view compliance visa cases in workspace"
ON compliance_visa_cases FOR SELECT
USING (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage compliance visa cases in workspace" ON compliance_visa_cases;
CREATE POLICY "Admins can manage compliance visa cases in workspace"
ON compliance_visa_cases FOR ALL
USING (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can view compliance documents in workspace" ON compliance_documents;
CREATE POLICY "Users can view compliance documents in workspace"
ON compliance_documents FOR SELECT
USING (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage compliance documents in workspace" ON compliance_documents;
CREATE POLICY "Admins can manage compliance documents in workspace"
ON compliance_documents FOR ALL
USING (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can view compliance audit events in workspace" ON compliance_audit_events;
CREATE POLICY "Users can view compliance audit events in workspace"
ON compliance_audit_events FOR SELECT
USING (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage compliance audit events in workspace" ON compliance_audit_events;
CREATE POLICY "Admins can manage compliance audit events in workspace"
ON compliance_audit_events FOR ALL
USING (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE INDEX IF NOT EXISTS idx_compliance_policies_workspace ON compliance_policies(workspace_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_regulatory_updates_workspace ON compliance_regulatory_updates(workspace_id, published_date DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_deadlines_workspace ON compliance_deadlines(workspace_id, due_at);
CREATE INDEX IF NOT EXISTS idx_compliance_visa_cases_workspace ON compliance_visa_cases(workspace_id, expires_on);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_workspace ON compliance_documents(workspace_id, expiry_date);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_events_workspace ON compliance_audit_events(workspace_id, event_time DESC);
