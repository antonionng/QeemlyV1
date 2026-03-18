CREATE TABLE IF NOT EXISTS market_publish_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0,
  tenant_visible BOOLEAN NOT NULL DEFAULT true,
  published_by UUID NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE market_publish_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Market publish events are readable by authenticated users" ON market_publish_events;
CREATE POLICY "Market publish events are readable by authenticated users"
ON market_publish_events FOR SELECT
USING (tenant_visible = true AND auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_market_publish_events_latest
ON market_publish_events(tenant_visible, published_at DESC);
