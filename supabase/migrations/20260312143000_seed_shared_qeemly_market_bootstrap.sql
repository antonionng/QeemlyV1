-- =============================================================================
-- Shared Qeemly market bootstrap
-- Seeds platform-owned contributor workspaces plus curated market benchmark rows.
-- This migration does NOT touch tenant runtime/demo data.
-- =============================================================================

WITH seed_workspaces(id, name, slug, adjustment) AS (
  VALUES
    ('91000000-0000-0000-0000-000000000001'::uuid, 'Qeemly Market Seed Core', 'qeemly-market-seed-core', 0.97::numeric),
    ('91000000-0000-0000-0000-000000000002'::uuid, 'Qeemly Market Seed Growth', 'qeemly-market-seed-growth', 1.00::numeric),
    ('91000000-0000-0000-0000-000000000003'::uuid, 'Qeemly Market Seed Enterprise', 'qeemly-market-seed-enterprise', 1.04::numeric)
)
INSERT INTO workspaces (id, name, slug)
SELECT id, name, slug
FROM seed_workspaces
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

WITH seed_settings(workspace_id, company_name, default_currency, industry, company_size) AS (
  VALUES
    ('91000000-0000-0000-0000-000000000001'::uuid, 'Qeemly Market Seed Core', 'AED', 'Technology', '51-200'),
    ('91000000-0000-0000-0000-000000000002'::uuid, 'Qeemly Market Seed Growth', 'AED', 'Technology', '201-500'),
    ('91000000-0000-0000-0000-000000000003'::uuid, 'Qeemly Market Seed Enterprise', 'AED', 'Technology', '1000+')
)
INSERT INTO workspace_settings (
  workspace_id,
  company_name,
  default_currency,
  industry,
  company_size,
  is_configured
)
SELECT
  workspace_id,
  company_name,
  default_currency,
  industry,
  company_size,
  true
FROM seed_settings
ON CONFLICT (workspace_id) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  default_currency = EXCLUDED.default_currency,
  industry = EXCLUDED.industry,
  company_size = EXCLUDED.company_size,
  is_configured = EXCLUDED.is_configured,
  updated_at = now();

DELETE FROM salary_benchmarks
WHERE workspace_id IN (
  '91000000-0000-0000-0000-000000000001'::uuid,
  '91000000-0000-0000-0000-000000000002'::uuid,
  '91000000-0000-0000-0000-000000000003'::uuid
)
  AND source = 'market'
  AND valid_from = DATE '2026-03-12';

WITH seed_workspaces(id, adjustment) AS (
  VALUES
    ('91000000-0000-0000-0000-000000000001'::uuid, 0.97::numeric),
    ('91000000-0000-0000-0000-000000000002'::uuid, 1.00::numeric),
    ('91000000-0000-0000-0000-000000000003'::uuid, 1.04::numeric)
),
role_multipliers(role_id, role_label, multiplier) AS (
  VALUES
    ('swe', 'Software Engineer', 1.00::numeric),
    ('swe-fe', 'Frontend Engineer', 0.95::numeric),
    ('swe-be', 'Backend Engineer', 1.05::numeric),
    ('swe-mobile', 'Mobile Engineer', 0.98::numeric),
    ('swe-devops', 'DevOps Engineer', 1.12::numeric),
    ('swe-data', 'Data Engineer', 1.08::numeric),
    ('swe-ml', 'ML Engineer', 1.18::numeric),
    ('pm', 'Product Manager', 1.10::numeric),
    ('tpm', 'Technical Program Manager', 1.04::numeric),
    ('designer', 'Product Designer', 0.86::numeric),
    ('ux-researcher', 'UX Researcher', 0.80::numeric),
    ('data-scientist', 'Data Scientist', 1.20::numeric),
    ('data-analyst', 'Data Analyst', 0.78::numeric),
    ('security', 'Security Engineer', 1.14::numeric),
    ('qa', 'QA Engineer', 0.82::numeric)
),
location_multipliers(location_id, location_label, currency, multiplier) AS (
  VALUES
    ('dubai', 'Dubai, UAE', 'AED', 1.00::numeric),
    ('abu-dhabi', 'Abu Dhabi, UAE', 'AED', 0.96::numeric),
    ('riyadh', 'Riyadh, Saudi Arabia', 'SAR', 0.93::numeric),
    ('jeddah', 'Jeddah, Saudi Arabia', 'SAR', 0.86::numeric),
    ('doha', 'Doha, Qatar', 'QAR', 0.95::numeric),
    ('manama', 'Manama, Bahrain', 'BHD', 0.74::numeric),
    ('kuwait-city', 'Kuwait City, Kuwait', 'KWD', 0.88::numeric),
    ('muscat', 'Muscat, Oman', 'OMR', 0.70::numeric)
),
level_multipliers(level_id, level_label, multiplier) AS (
  VALUES
    ('ic2', 'Mid-Level (IC2)', 0.76::numeric),
    ('ic3', 'Senior (IC3)', 1.00::numeric),
    ('ic4', 'Staff (IC4)', 1.30::numeric),
    ('ic5', 'Principal (IC5)', 1.56::numeric),
    ('m1', 'Manager (M1)', 1.42::numeric),
    ('d1', 'Director (D1)', 2.05::numeric)
),
base_rate AS (
  SELECT 18000::numeric AS swe_ic3_dubai_p50
),
grid AS (
  SELECT
    sw.id AS workspace_id,
    r.role_id,
    r.role_label,
    l.location_id,
    l.location_label,
    lv.level_id,
    lv.level_label,
    l.currency,
    sw.adjustment,
    (
      (
        (abs(hashtext(r.role_id || ':' || l.location_id || ':' || lv.level_id || ':' || sw.id::text)) % 41)::numeric - 20
      ) / 1000
    ) AS jitter_ratio,
    b.swe_ic3_dubai_p50 * r.multiplier * l.multiplier * lv.multiplier AS base_p50
  FROM seed_workspaces sw
  CROSS JOIN role_multipliers r
  CROSS JOIN location_multipliers l
  CROSS JOIN level_multipliers lv
  CROSS JOIN base_rate b
),
calculated AS (
  SELECT
    workspace_id,
    role_id,
    role_label,
    location_id,
    location_label,
    level_id,
    level_label,
    currency,
    round(base_p50 * adjustment * (1 + jitter_ratio), 2) AS p50,
    24 + (abs(hashtext(workspace_id::text || ':' || role_id || ':' || location_id || ':' || level_id)) % 36) AS sample_size
  FROM grid
)
INSERT INTO salary_benchmarks (
  workspace_id,
  role_id,
  location_id,
  level_id,
  industry,
  company_size,
  currency,
  p10,
  p25,
  p50,
  p75,
  p90,
  sample_size,
  source,
  confidence,
  valid_from,
  valid_to
)
SELECT
  workspace_id,
  role_id,
  location_id,
  level_id,
  NULL AS industry,
  NULL AS company_size,
  currency,
  round(p50 * 0.68, 2) AS p10,
  round(p50 * 0.84, 2) AS p25,
  p50,
  round(p50 * 1.18, 2) AS p75,
  round(p50 * 1.36, 2) AS p90,
  sample_size,
  'market'::text AS source,
  'high'::text AS confidence,
  DATE '2026-03-12' AS valid_from,
  NULL AS valid_to
FROM calculated;

WITH pooled_seed_rows AS (
  SELECT
    role_id,
    location_id,
    level_id,
    currency,
    (array_agg(p10 ORDER BY p10))[1] AS p10,
    (array_agg(p25 ORDER BY p25))[1] AS p25,
    (array_agg(p50 ORDER BY p50))[2] AS p50,
    (array_agg(p75 ORDER BY p75))[3] AS p75,
    (array_agg(p90 ORDER BY p90))[3] AS p90,
    count(*)::int AS sample_size,
    count(DISTINCT workspace_id)::int AS contributor_count
  FROM salary_benchmarks
  WHERE workspace_id IN (
    '91000000-0000-0000-0000-000000000001'::uuid,
    '91000000-0000-0000-0000-000000000002'::uuid,
    '91000000-0000-0000-0000-000000000003'::uuid
  )
    AND source = 'market'
    AND valid_from = DATE '2026-03-12'
  GROUP BY role_id, location_id, level_id, currency
),
pool_bootstrap_allowed AS (
  SELECT NOT EXISTS (SELECT 1 FROM platform_market_benchmarks) AS should_bootstrap
)
INSERT INTO platform_market_benchmarks (
  role_id,
  location_id,
  level_id,
  currency,
  industry,
  company_size,
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
  is_public
)
SELECT
  row.role_id,
  row.location_id,
  row.level_id,
  row.currency,
  NULL AS industry,
  NULL AS company_size,
  row.p10,
  row.p25,
  row.p50,
  row.p75,
  row.p90,
  row.sample_size,
  row.contributor_count,
  'admin'::text AS provenance,
  '{"employee":0,"uploaded":0,"admin":3}'::jsonb AS source_breakdown,
  now() AS freshness_at,
  DATE '2026-03-12' AS valid_from,
  true AS is_public
FROM pooled_seed_rows row
CROSS JOIN pool_bootstrap_allowed bootstrap
WHERE bootstrap.should_bootstrap;

WITH pool_bootstrap_allowed AS (
  SELECT EXISTS (
    SELECT 1
    FROM platform_market_benchmarks
    WHERE valid_from = DATE '2026-03-12'
  ) AS should_bootstrap
)
DELETE FROM public_benchmark_snapshots
WHERE workspace_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM pool_bootstrap_allowed
    WHERE should_bootstrap
  );

WITH pooled_rows AS (
  SELECT
    role_id,
    location_id,
    level_id,
    currency,
    p25,
    p50,
    p75,
    contributor_count
  FROM platform_market_benchmarks
  WHERE valid_from = DATE '2026-03-12'
),
role_labels(role_id, role_label) AS (
  VALUES
    ('swe', 'Software Engineer'),
    ('swe-fe', 'Frontend Engineer'),
    ('swe-be', 'Backend Engineer'),
    ('swe-mobile', 'Mobile Engineer'),
    ('swe-devops', 'DevOps Engineer'),
    ('swe-data', 'Data Engineer'),
    ('swe-ml', 'ML Engineer'),
    ('pm', 'Product Manager'),
    ('tpm', 'Technical Program Manager'),
    ('designer', 'Product Designer'),
    ('ux-researcher', 'UX Researcher'),
    ('data-scientist', 'Data Scientist'),
    ('data-analyst', 'Data Analyst'),
    ('security', 'Security Engineer'),
    ('qa', 'QA Engineer')
),
location_labels(location_id, location_label) AS (
  VALUES
    ('dubai', 'Dubai, UAE'),
    ('abu-dhabi', 'Abu Dhabi, UAE'),
    ('riyadh', 'Riyadh, Saudi Arabia'),
    ('jeddah', 'Jeddah, Saudi Arabia'),
    ('doha', 'Doha, Qatar'),
    ('manama', 'Manama, Bahrain'),
    ('kuwait-city', 'Kuwait City, Kuwait'),
    ('muscat', 'Muscat, Oman')
),
level_labels(level_id, level_label) AS (
  VALUES
    ('ic2', 'Mid-Level (IC2)'),
    ('ic3', 'Senior (IC3)'),
    ('ic4', 'Staff (IC4)'),
    ('ic5', 'Principal (IC5)'),
    ('m1', 'Manager (M1)'),
    ('d1', 'Director (D1)')
)
INSERT INTO public_benchmark_snapshots (
  workspace_id,
  role_id,
  role_label,
  location_id,
  location_label,
  level_id,
  level_label,
  industry,
  company_size,
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
  updated_at
)
SELECT
  NULL AS workspace_id,
  pooled.role_id,
  roles.role_label,
  pooled.location_id,
  locations.location_label,
  pooled.level_id,
  levels.level_label,
  NULL AS industry,
  NULL AS company_size,
  pooled.currency,
  pooled.p25,
  pooled.p50,
  pooled.p75,
  pooled.contributor_count AS submissions_this_week,
  '0%' AS mom_delta_p25,
  '0%' AS mom_delta_p50,
  '0%' AS mom_delta_p75,
  '0%' AS trend_delta,
  true AS is_public,
  now() AS updated_at
FROM pooled_rows pooled
JOIN role_labels roles ON roles.role_id = pooled.role_id
JOIN location_labels locations ON locations.location_id = pooled.location_id
JOIN level_labels levels ON levels.level_id = pooled.level_id;
