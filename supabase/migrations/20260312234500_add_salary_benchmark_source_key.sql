ALTER TABLE salary_benchmarks
ADD COLUMN IF NOT EXISTS source_key TEXT GENERATED ALWAYS AS (
  CASE
    WHEN source = 'market' THEN COALESCE(market_source_slug, '')
    ELSE COALESCE(source, '')
  END
) STORED;

DROP INDEX IF EXISTS idx_salary_benchmarks_segmented_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_salary_benchmarks_segmented_unique
ON salary_benchmarks(
  workspace_id,
  role_id,
  location_id,
  level_id,
  industry_key,
  company_size_key,
  source_key,
  valid_from
);
