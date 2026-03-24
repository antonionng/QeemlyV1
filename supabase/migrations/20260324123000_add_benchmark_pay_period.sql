ALTER TABLE salary_benchmarks
ADD COLUMN IF NOT EXISTS pay_period TEXT;

ALTER TABLE platform_market_benchmarks
ADD COLUMN IF NOT EXISTS pay_period TEXT;

ALTER TABLE IF EXISTS platform_market_benchmarks_staging
ADD COLUMN IF NOT EXISTS pay_period TEXT;

UPDATE salary_benchmarks
SET pay_period = CASE
  WHEN pay_period IN ('monthly', 'annual') THEN pay_period
  WHEN COALESCE(p50, 0) >= 100000 THEN 'annual'
  ELSE 'monthly'
END
WHERE pay_period IS NULL
   OR pay_period NOT IN ('monthly', 'annual');

UPDATE platform_market_benchmarks
SET pay_period = CASE
  WHEN pay_period IN ('monthly', 'annual') THEN pay_period
  WHEN COALESCE(p50, 0) >= 100000 THEN 'annual'
  ELSE 'monthly'
END
WHERE pay_period IS NULL
   OR pay_period NOT IN ('monthly', 'annual');

UPDATE platform_market_benchmarks_staging
SET pay_period = CASE
  WHEN pay_period IN ('monthly', 'annual') THEN pay_period
  WHEN COALESCE(p50, 0) >= 100000 THEN 'annual'
  ELSE 'monthly'
END
WHERE pay_period IS NULL
   OR pay_period NOT IN ('monthly', 'annual');

ALTER TABLE salary_benchmarks
ALTER COLUMN pay_period SET DEFAULT 'monthly';

ALTER TABLE platform_market_benchmarks
ALTER COLUMN pay_period SET DEFAULT 'annual';

ALTER TABLE IF EXISTS platform_market_benchmarks_staging
ALTER COLUMN pay_period SET DEFAULT 'annual';

ALTER TABLE salary_benchmarks
ADD CONSTRAINT salary_benchmarks_pay_period_check
CHECK (pay_period IN ('monthly', 'annual')) NOT VALID;

ALTER TABLE salary_benchmarks
VALIDATE CONSTRAINT salary_benchmarks_pay_period_check;

ALTER TABLE platform_market_benchmarks
ADD CONSTRAINT platform_market_benchmarks_pay_period_check
CHECK (pay_period IN ('monthly', 'annual')) NOT VALID;

ALTER TABLE platform_market_benchmarks
VALIDATE CONSTRAINT platform_market_benchmarks_pay_period_check;

ALTER TABLE IF EXISTS platform_market_benchmarks_staging
ADD CONSTRAINT platform_market_benchmarks_staging_pay_period_check
CHECK (pay_period IN ('monthly', 'annual')) NOT VALID;

ALTER TABLE IF EXISTS platform_market_benchmarks_staging
VALIDATE CONSTRAINT platform_market_benchmarks_staging_pay_period_check;

CREATE OR REPLACE FUNCTION swap_platform_market_refresh_staging()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM platform_market_benchmarks
  WHERE valid_from >= DATE '1900-01-01';

  INSERT INTO platform_market_benchmarks (
    role_id,
    location_id,
    level_id,
    currency,
    p10,
    p25,
    p50,
    p75,
    p90,
    sample_size,
    contributor_count,
    provenance,
    market_source_tier,
    source_breakdown,
    freshness_at,
    valid_from,
    is_public,
    industry,
    company_size,
    pay_period
  )
  SELECT
    role_id,
    location_id,
    level_id,
    currency,
    p10,
    p25,
    p50,
    p75,
    p90,
    sample_size,
    contributor_count,
    provenance,
    market_source_tier,
    source_breakdown,
    freshness_at,
    valid_from,
    is_public,
    industry,
    company_size,
    pay_period
  FROM platform_market_benchmarks_staging;

  DELETE FROM public_benchmark_snapshots
  WHERE workspace_id IS NULL;

  INSERT INTO public_benchmark_snapshots (
    workspace_id,
    role_id,
    role_label,
    location_id,
    location_label,
    level_id,
    level_label,
    currency,
    p25,
    p50,
    p75,
    submissions_this_week,
    mom_delta_p25,
    mom_delta_p50,
    mom_delta_p75,
    trend_delta,
    is_public,
    updated_at,
    industry,
    company_size,
    market_source_tier
  )
  SELECT
    workspace_id,
    role_id,
    role_label,
    location_id,
    location_label,
    level_id,
    level_label,
    currency,
    p25,
    p50,
    p75,
    submissions_this_week,
    mom_delta_p25,
    mom_delta_p50,
    mom_delta_p75,
    trend_delta,
    is_public,
    updated_at,
    industry,
    company_size,
    market_source_tier
  FROM public_benchmark_snapshots_staging;

  DELETE FROM platform_market_benchmarks_staging
  WHERE valid_from >= DATE '1900-01-01';

  DELETE FROM public_benchmark_snapshots_staging
  WHERE updated_at >= TIMESTAMPTZ '1900-01-01T00:00:00.000Z';
END;
$$;
