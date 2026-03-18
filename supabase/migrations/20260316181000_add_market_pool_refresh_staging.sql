CREATE TABLE IF NOT EXISTS platform_market_benchmarks_staging (
  LIKE platform_market_benchmarks INCLUDING DEFAULTS INCLUDING GENERATED
);

CREATE TABLE IF NOT EXISTS public_benchmark_snapshots_staging (
  LIKE public_benchmark_snapshots INCLUDING DEFAULTS INCLUDING GENERATED
);

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
    source_breakdown,
    freshness_at,
    valid_from,
    is_public,
    industry,
    company_size
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
    source_breakdown,
    freshness_at,
    valid_from,
    is_public,
    industry,
    company_size
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
    company_size
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
    company_size
  FROM public_benchmark_snapshots_staging;

  DELETE FROM platform_market_benchmarks_staging
  WHERE valid_from >= DATE '1900-01-01';

  DELETE FROM public_benchmark_snapshots_staging
  WHERE updated_at >= TIMESTAMPTZ '1900-01-01T00:00:00.000Z';
END;
$$;
