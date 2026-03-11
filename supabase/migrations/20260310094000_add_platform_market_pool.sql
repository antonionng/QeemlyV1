CREATE TABLE IF NOT EXISTS platform_market_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id TEXT NOT NULL,
  location_id TEXT NOT NULL,
  level_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  p10 NUMERIC(12,2) NOT NULL,
  p25 NUMERIC(12,2) NOT NULL,
  p50 NUMERIC(12,2) NOT NULL,
  p75 NUMERIC(12,2) NOT NULL,
  p90 NUMERIC(12,2) NOT NULL,
  sample_size INTEGER NOT NULL DEFAULT 0,
  contributor_count INTEGER NOT NULL DEFAULT 0,
  provenance TEXT NOT NULL CHECK (provenance IN ('employee', 'uploaded', 'admin', 'blended')),
  source_breakdown JSONB NOT NULL DEFAULT '{"employee":0,"uploaded":0,"admin":0}'::jsonb,
  freshness_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role_id, location_id, level_id, valid_from)
);

ALTER TABLE platform_market_benchmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform market benchmarks are readable by authenticated users" ON platform_market_benchmarks;
CREATE POLICY "Platform market benchmarks are readable by authenticated users"
ON platform_market_benchmarks FOR SELECT
USING (is_public = true OR auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_platform_market_benchmarks_lookup
ON platform_market_benchmarks(role_id, location_id, level_id, valid_from DESC);

CREATE INDEX IF NOT EXISTS idx_platform_market_benchmarks_public
ON platform_market_benchmarks(is_public, freshness_at DESC);
