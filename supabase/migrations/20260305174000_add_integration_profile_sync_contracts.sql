-- Provider-agnostic contracts for HRIS/ATS profile sync.

CREATE TABLE IF NOT EXISTS integration_field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  domain TEXT NOT NULL CHECK (domain IN ('employee_profile', 'compensation', 'equity', 'contributions', 'visa')),
  source_field TEXT NOT NULL,
  target_field TEXT NOT NULL,
  transform_rule TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  precedence_rank INTEGER NOT NULL DEFAULT 100,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(integration_id, domain, source_field, target_field)
);

CREATE TABLE IF NOT EXISTS integration_sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE UNIQUE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  last_cursor TEXT,
  last_event_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  source_of_truth JSONB NOT NULL DEFAULT '{"employee_profile":"hris","visa":"hris","equity":"manual","contributions":"hris"}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS integration_inbound_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  event_key TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'failed', 'ignored')),
  error_message TEXT,
  UNIQUE(integration_id, event_key)
);

ALTER TABLE integration_field_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_inbound_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view integration field mappings" ON integration_field_mappings;
CREATE POLICY "Users can view integration field mappings"
ON integration_field_mappings FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage integration field mappings" ON integration_field_mappings;
CREATE POLICY "Admins can manage integration field mappings"
ON integration_field_mappings FOR ALL
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users can view integration sync state" ON integration_sync_state;
CREATE POLICY "Users can view integration sync state"
ON integration_sync_state FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage integration sync state" ON integration_sync_state;
CREATE POLICY "Admins can manage integration sync state"
ON integration_sync_state FOR ALL
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users can view integration inbound events" ON integration_inbound_events;
CREATE POLICY "Users can view integration inbound events"
ON integration_inbound_events FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage integration inbound events" ON integration_inbound_events;
CREATE POLICY "Admins can manage integration inbound events"
ON integration_inbound_events FOR ALL
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_integration_field_mappings_lookup
  ON integration_field_mappings(workspace_id, integration_id, domain, enabled);
CREATE INDEX IF NOT EXISTS idx_integration_sync_state_workspace
  ON integration_sync_state(workspace_id, integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_inbound_events_workspace
  ON integration_inbound_events(workspace_id, integration_id, received_at DESC);
