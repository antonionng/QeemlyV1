-- Canonical normalized market signals across benchmark/compliance/relocation/billing domains.
-- This provides a consistent schema for cross-industry analytics and reporting.

CREATE TABLE IF NOT EXISTS industry_market_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  source_slug TEXT NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN ('benchmark', 'compliance', 'relocation', 'billing')),
  industry TEXT NOT NULL DEFAULT 'general',
  metric_key TEXT NOT NULL,
  metric_value_numeric NUMERIC,
  metric_value_text TEXT,
  unit TEXT,
  currency TEXT,
  role_id TEXT NOT NULL DEFAULT '',
  location_id TEXT NOT NULL DEFAULT '',
  level_id TEXT NOT NULL DEFAULT '',
  geo_region TEXT,
  period_start DATE NOT NULL DEFAULT CURRENT_DATE,
  period_end DATE,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (metric_value_numeric IS NOT NULL OR metric_value_text IS NOT NULL)
);

ALTER TABLE industry_market_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view workspace industry market signals" ON industry_market_signals;
CREATE POLICY "Users can view workspace industry market signals"
ON industry_market_signals FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert workspace industry market signals" ON industry_market_signals;
CREATE POLICY "Users can insert workspace industry market signals"
ON industry_market_signals FOR INSERT
WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update workspace industry market signals" ON industry_market_signals;
CREATE POLICY "Users can update workspace industry market signals"
ON industry_market_signals FOR UPDATE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete workspace industry market signals" ON industry_market_signals;
CREATE POLICY "Users can delete workspace industry market signals"
ON industry_market_signals FOR DELETE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE UNIQUE INDEX IF NOT EXISTS idx_industry_market_signals_dedup
  ON industry_market_signals(
    workspace_id, source_slug, domain, industry, metric_key, period_start, role_id, location_id, level_id
  );

CREATE INDEX IF NOT EXISTS idx_industry_market_signals_workspace_domain
  ON industry_market_signals(workspace_id, domain, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_industry_market_signals_workspace_industry
  ON industry_market_signals(workspace_id, industry, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_industry_market_signals_metric
  ON industry_market_signals(metric_key, period_start DESC);
