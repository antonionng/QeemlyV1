-- =============================================================================
-- Seed Qeemly public GCC market benchmarks
-- Values are monthly compensation in AED.
-- =============================================================================

-- Replace the current public pool so this migration is deterministic.
DELETE FROM public_benchmark_snapshots
WHERE is_public = true;

WITH role_multipliers(role_id, role_label, multiplier) AS (
  VALUES
    ('swe', 'Software Engineer', 1.00::numeric),
    ('swe-fe', 'Frontend Engineer', 0.95::numeric),
    ('swe-be', 'Backend Engineer', 1.05::numeric),
    ('swe-mobile', 'Mobile Engineer', 0.98::numeric),
    ('swe-devops', 'DevOps Engineer', 1.10::numeric),
    ('swe-data', 'Data Engineer', 1.08::numeric),
    ('swe-ml', 'ML Engineer', 1.18::numeric),
    ('pm', 'Product Manager', 1.12::numeric),
    ('tpm', 'Technical PM', 1.05::numeric),
    ('designer', 'Product Designer', 0.85::numeric),
    ('ux-researcher', 'UX Researcher', 0.78::numeric),
    ('data-scientist', 'Data Scientist', 1.20::numeric),
    ('data-analyst', 'Data Analyst', 0.76::numeric),
    ('security', 'Security Engineer', 1.15::numeric),
    ('qa', 'QA Engineer', 0.78::numeric)
),
location_multipliers(location_id, location_label, multiplier) AS (
  VALUES
    ('dubai', 'Dubai, UAE', 1.00::numeric),
    ('abu-dhabi', 'Abu Dhabi, UAE', 0.95::numeric),
    ('riyadh', 'Riyadh, Saudi Arabia', 0.88::numeric),
    ('jeddah', 'Jeddah, Saudi Arabia', 0.80::numeric),
    ('doha', 'Doha, Qatar', 0.90::numeric),
    ('manama', 'Manama, Bahrain', 0.68::numeric),
    ('kuwait-city', 'Kuwait City, Kuwait', 0.82::numeric),
    ('muscat', 'Muscat, Oman', 0.62::numeric)
),
level_multipliers(level_id, level_label, multiplier) AS (
  VALUES
    ('ic1', 'Junior (IC1)', 0.52::numeric),
    ('ic2', 'Mid-Level (IC2)', 0.74::numeric),
    ('ic3', 'Senior (IC3)', 1.00::numeric),
    ('ic4', 'Staff (IC4)', 1.32::numeric),
    ('ic5', 'Principal (IC5)', 1.58::numeric),
    ('m1', 'Manager (M1)', 1.42::numeric),
    ('m2', 'Senior Manager (M2)', 1.68::numeric),
    ('d1', 'Director (D1)', 2.05::numeric),
    ('d2', 'Senior Director (D2)', 2.40::numeric),
    ('vp', 'VP', 2.85::numeric)
),
base_rate AS (
  SELECT 20000::numeric AS swe_ic3_dubai_p50
),
benchmark_grid AS (
  SELECT
    r.role_id,
    r.role_label,
    l.location_id,
    l.location_label,
    lv.level_id,
    lv.level_label,
    -- Deterministic jitter in the -2.5%..+2.5% range.
    (
      (
        (abs(hashtext(r.role_id || ':' || l.location_id || ':' || lv.level_id)) % 51)::numeric - 25
      ) / 1000
    ) AS jitter_ratio,
    b.swe_ic3_dubai_p50 * r.multiplier * l.multiplier * lv.multiplier AS base_p50
  FROM role_multipliers r
  CROSS JOIN location_multipliers l
  CROSS JOIN level_multipliers lv
  CROSS JOIN base_rate b
),
calculated AS (
  SELECT
    role_id,
    role_label,
    location_id,
    location_label,
    level_id,
    level_label,
    round(base_p50 * (1 + jitter_ratio), 0) AS p50
  FROM benchmark_grid
)
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
  is_public
)
SELECT
  NULL AS workspace_id,
  c.role_id,
  c.role_label,
  c.location_id,
  c.location_label,
  c.level_id,
  c.level_label,
  'AED' AS currency,
  round(c.p50 * 0.85, 2) AS p25,
  round(c.p50, 2) AS p50,
  round(c.p50 * 1.18, 2) AS p75,
  -- Deterministic, realistic submission volume.
  (
    5
    + (abs(hashtext(c.role_id || ':' || c.location_id || ':submissions')) % 96)
  )::int AS submissions_this_week,
  (
    round(
      (
        0.5
        + (abs(hashtext(c.role_id || ':' || c.level_id || ':p25')) % 21) / 10.0
      )::numeric,
      1
    )::text
    || '%'
  ) AS mom_delta_p25,
  (
    round(
      (
        0.5
        + (abs(hashtext(c.role_id || ':' || c.level_id || ':p50')) % 21) / 10.0
      )::numeric,
      1
    )::text
    || '%'
  ) AS mom_delta_p50,
  (
    round(
      (
        0.5
        + (abs(hashtext(c.role_id || ':' || c.level_id || ':p75')) % 21) / 10.0
      )::numeric,
      1
    )::text
    || '%'
  ) AS mom_delta_p75,
  (
    round(
      (
        0.5
        + (abs(hashtext(c.location_id || ':' || c.level_id || ':trend')) % 21) / 10.0
      )::numeric,
      1
    )::text
    || '%'
  ) AS trend_delta,
  true AS is_public
FROM calculated c;
