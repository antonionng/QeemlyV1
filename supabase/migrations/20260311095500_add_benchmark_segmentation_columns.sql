ALTER TABLE salary_benchmarks
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS company_size TEXT;

ALTER TABLE salary_benchmarks
  ADD COLUMN IF NOT EXISTS industry_key TEXT GENERATED ALWAYS AS (COALESCE(industry, '')) STORED,
  ADD COLUMN IF NOT EXISTS company_size_key TEXT GENERATED ALWAYS AS (COALESCE(company_size, '')) STORED;

ALTER TABLE salary_benchmarks
  DROP CONSTRAINT IF EXISTS salary_benchmarks_workspace_id_role_id_location_id_level_id_valid_from_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_salary_benchmarks_segmented_unique
ON salary_benchmarks(
  workspace_id,
  role_id,
  location_id,
  level_id,
  industry_key,
  company_size_key,
  valid_from
);

ALTER TABLE platform_market_benchmarks
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS company_size TEXT;

ALTER TABLE platform_market_benchmarks
  ADD COLUMN IF NOT EXISTS industry_key TEXT GENERATED ALWAYS AS (COALESCE(industry, '')) STORED,
  ADD COLUMN IF NOT EXISTS company_size_key TEXT GENERATED ALWAYS AS (COALESCE(company_size, '')) STORED;

ALTER TABLE platform_market_benchmarks
  DROP CONSTRAINT IF EXISTS platform_market_benchmarks_role_id_location_id_level_id_valid_from_key;

DROP INDEX IF EXISTS idx_platform_market_benchmarks_lookup;

CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_market_benchmarks_segmented_unique
ON platform_market_benchmarks(
  role_id,
  location_id,
  level_id,
  industry_key,
  company_size_key,
  valid_from
);

CREATE INDEX IF NOT EXISTS idx_platform_market_benchmarks_lookup
ON platform_market_benchmarks(
  role_id,
  location_id,
  level_id,
  industry_key,
  company_size_key,
  valid_from DESC
);

ALTER TABLE public_benchmark_snapshots
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS company_size TEXT;
