/*
  SEED USER FOR DEMO
  Resets and reseeds Experrt with realistic active data.
*/

-- 0) Workspace bootstrap (idempotent)
INSERT INTO workspaces (id, name, slug)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Experrt',
  'experrt-demo'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name;

-- 1) Clear tenant runtime data for a fresh reseed
WITH ws AS (
  SELECT id FROM workspaces WHERE slug = 'experrt-demo' LIMIT 1
), tenant_employees AS (
  SELECT id FROM employees WHERE workspace_id = (SELECT id FROM ws)
)
DELETE FROM compensation_history
WHERE employee_id IN (SELECT id FROM tenant_employees);

WITH ws AS (
  SELECT id FROM workspaces WHERE slug = 'experrt-demo' LIMIT 1
)
DELETE FROM compliance_visa_cases WHERE workspace_id = (SELECT id FROM ws);

WITH ws AS (
  SELECT id FROM workspaces WHERE slug = 'experrt-demo' LIMIT 1
)
DELETE FROM compliance_audit_events WHERE workspace_id = (SELECT id FROM ws);

WITH ws AS (
  SELECT id FROM workspaces WHERE slug = 'experrt-demo' LIMIT 1
)
DELETE FROM compliance_documents WHERE workspace_id = (SELECT id FROM ws);

WITH ws AS (
  SELECT id FROM workspaces WHERE slug = 'experrt-demo' LIMIT 1
)
DELETE FROM compliance_deadlines WHERE workspace_id = (SELECT id FROM ws);

WITH ws AS (
  SELECT id FROM workspaces WHERE slug = 'experrt-demo' LIMIT 1
)
DELETE FROM compliance_regulatory_updates WHERE workspace_id = (SELECT id FROM ws);

WITH ws AS (
  SELECT id FROM workspaces WHERE slug = 'experrt-demo' LIMIT 1
)
DELETE FROM compliance_policies WHERE workspace_id = (SELECT id FROM ws);

WITH ws AS (
  SELECT id FROM workspaces WHERE slug = 'experrt-demo' LIMIT 1
)
DELETE FROM compliance_snapshots WHERE workspace_id = (SELECT id FROM ws);

WITH ws AS (
  SELECT id FROM workspaces WHERE slug = 'experrt-demo' LIMIT 1
)
DELETE FROM salary_benchmarks WHERE workspace_id = (SELECT id FROM ws);

WITH ws AS (
  SELECT id FROM workspaces WHERE slug = 'experrt-demo' LIMIT 1
)
DELETE FROM ai_chat_messages
WHERE thread_id IN (
  SELECT id FROM ai_chat_threads WHERE workspace_id = (SELECT id FROM ws)
);

WITH ws AS (
  SELECT id FROM workspaces WHERE slug = 'experrt-demo' LIMIT 1
)
DELETE FROM ai_chat_threads WHERE workspace_id = (SELECT id FROM ws);

WITH ws AS (
  SELECT id FROM workspaces WHERE slug = 'experrt-demo' LIMIT 1
)
DELETE FROM employees WHERE workspace_id = (SELECT id FROM ws);

-- 2) Seed 85 realistic employees
WITH ws AS (
  SELECT id AS workspace_id FROM workspaces WHERE slug = 'experrt-demo' LIMIT 1
), first_names AS (
  SELECT ARRAY[
    'Ahmed','Aisha','Omar','Fatima','Hassan','Noor','Khalid','Layla','Yousef','Mariam',
    'Salman','Huda','Rami','Dalia','Nasser','Sara','Tariq','Amal','Zayd','Reem'
  ] AS arr
), last_names AS (
  SELECT ARRAY[
    'Al-Mansoori','Al-Harbi','Al-Qahtani','Al-Khalifa','Al-Hashemi','Al-Suwaidi','Al-Nuaimi','Al-Sabah',
    'Khan','Rahman','Siddiqui','Patel','Sharma','Fernandes','Dsouza','Haddad','Nasser','Maktoum','Faris','Yazid'
  ] AS arr
), generated AS (
  SELECT
    g.i,
    (SELECT workspace_id FROM ws) AS workspace_id,
    (SELECT arr[((g.i - 1) % 20) + 1] FROM first_names) AS first_name,
    (SELECT arr[((g.i * 7 - 1) % 20) + 1] FROM last_names) AS last_name,
    CASE
      WHEN (g.i % 100) < 35 THEN 'Engineering'
      WHEN (g.i % 100) < 47 THEN 'Product'
      WHEN (g.i % 100) < 56 THEN 'Design'
      WHEN (g.i % 100) < 66 THEN 'Data'
      WHEN (g.i % 100) < 75 THEN 'Sales'
      WHEN (g.i % 100) < 82 THEN 'Marketing'
      WHEN (g.i % 100) < 89 THEN 'Operations'
      WHEN (g.i % 100) < 95 THEN 'Finance'
      ELSE 'HR'
    END AS department
  FROM generate_series(1, 85) AS g(i)
), with_role_level_location AS (
  SELECT
    g.*,
    CASE g.department
      WHEN 'Engineering' THEN (ARRAY['swe','swe-fe','swe-be','swe-mobile','swe-devops','swe-data','swe-ml','security','qa'])[((g.i * 3) % 9) + 1]
      WHEN 'Product' THEN (ARRAY['pm','tpm'])[((g.i * 5) % 2) + 1]
      WHEN 'Design' THEN (ARRAY['designer','ux-researcher'])[((g.i * 7) % 2) + 1]
      WHEN 'Data' THEN (ARRAY['data-scientist','data-analyst','swe-data'])[((g.i * 11) % 3) + 1]
      WHEN 'Sales' THEN 'pm'
      WHEN 'Marketing' THEN 'pm'
      WHEN 'Operations' THEN 'tpm'
      WHEN 'Finance' THEN 'data-analyst'
      ELSE 'pm'
    END AS role_id,
    CASE
      WHEN (g.i % 100) < 12 THEN 'ic1'
      WHEN (g.i % 100) < 30 THEN 'ic2'
      WHEN (g.i % 100) < 55 THEN 'ic3'
      WHEN (g.i % 100) < 70 THEN 'ic4'
      WHEN (g.i % 100) < 78 THEN 'ic5'
      WHEN (g.i % 100) < 88 THEN 'm1'
      WHEN (g.i % 100) < 94 THEN 'm2'
      WHEN (g.i % 100) < 97 THEN 'd1'
      WHEN (g.i % 100) < 99 THEN 'd2'
      ELSE 'vp'
    END AS level_id,
    CASE
      WHEN (g.i % 100) < 28 THEN 'dubai'
      WHEN (g.i % 100) < 42 THEN 'abu-dhabi'
      WHEN (g.i % 100) < 56 THEN 'riyadh'
      WHEN (g.i % 100) < 64 THEN 'jeddah'
      WHEN (g.i % 100) < 74 THEN 'doha'
      WHEN (g.i % 100) < 83 THEN 'manama'
      WHEN (g.i % 100) < 92 THEN 'kuwait-city'
      ELSE 'muscat'
    END AS location_id
  FROM generated g
), market_comp AS (
  SELECT
    role_id,
    level_id,
    location_id,
    p25,
    p50,
    p75
  FROM public_benchmark_snapshots
  WHERE is_public = true
), prepared AS (
  SELECT
    (
      substr(md5('experrt-employee-' || w.i),1,8) || '-' ||
      substr(md5('experrt-employee-' || w.i),9,4) || '-4' ||
      substr(md5('experrt-employee-' || w.i),14,3) || '-a' ||
      substr(md5('experrt-employee-' || w.i),18,3) || '-' ||
      substr(md5('experrt-employee-' || w.i),21,12)
    )::uuid AS id,
    w.workspace_id,
    w.first_name,
    w.last_name,
    lower(replace(w.first_name,'''','')) || '.' || lower(replace(w.last_name,'''','')) || '.' || lpad(w.i::text,3,'0') || '@experrt.com' AS email,
    w.department,
    w.role_id,
    w.level_id,
    w.location_id,
    'AED'::text AS currency,
    round(
      (
        coalesce(mc.p50, 20000) * 12
      ) * (
        CASE
          -- 15% below-band cohort
          WHEN (w.i % 20) IN (0, 1, 2) THEN 0.74 + ((w.i % 5) * 0.02)
          -- 65% in-band cohort
          WHEN (w.i % 20) BETWEEN 3 AND 15 THEN 0.88 + ((w.i % 9) * 0.03)
          -- 20% above-band cohort
          ELSE 1.20 + ((w.i % 5) * 0.04)
        END
      ) * (
        1 - (
          CASE
            WHEN w.level_id IN ('m2', 'd1', 'd2', 'vp') THEN 0.18
            WHEN w.level_id IN ('ic4', 'ic5', 'm1') THEN 0.12
            ELSE 0.07
          END
          + CASE
            WHEN w.level_id IN ('ic1', 'ic2') THEN 0.00
            WHEN w.level_id = 'ic3' THEN 0.04
            WHEN w.level_id IN ('ic4', 'ic5') THEN 0.07
            ELSE 0.10
          END
        )
      )
    )::numeric AS base_salary,
    round(
      (
        coalesce(mc.p50, 20000) * 12
      ) * (
        CASE
          WHEN (w.i % 20) IN (0, 1, 2) THEN 0.74 + ((w.i % 5) * 0.02)
          WHEN (w.i % 20) BETWEEN 3 AND 15 THEN 0.88 + ((w.i % 9) * 0.03)
          ELSE 1.20 + ((w.i % 5) * 0.04)
        END
      ) * (
        CASE
          WHEN w.level_id IN ('m2', 'd1', 'd2', 'vp') THEN 0.18
          WHEN w.level_id IN ('ic4', 'ic5', 'm1') THEN 0.12
          ELSE 0.07
        END
      )
    )::numeric AS bonus,
    round(
      (
        coalesce(mc.p50, 20000) * 12
      ) * (
        CASE
          WHEN (w.i % 20) IN (0, 1, 2) THEN 0.74 + ((w.i % 5) * 0.02)
          WHEN (w.i % 20) BETWEEN 3 AND 15 THEN 0.88 + ((w.i % 9) * 0.03)
          ELSE 1.20 + ((w.i % 5) * 0.04)
        END
      ) * (
        CASE
          WHEN w.level_id IN ('ic1', 'ic2') THEN 0.00
          WHEN w.level_id = 'ic3' THEN 0.04
          WHEN w.level_id IN ('ic4', 'ic5') THEN 0.07
          ELSE 0.10
        END
      )
    )::numeric AS equity,
    'active'::text AS status,
    CASE WHEN (w.i % 10) < 6 THEN 'national' ELSE 'expat' END AS employment_type,
    (CURRENT_DATE - (((w.i * 37) % 2550)::int))::date AS hire_date,
    (CURRENT_DATE - (((w.i * 13) % 320)::int))::date AS last_review_date,
    CASE
      WHEN (w.i % 20) < 2 THEN 'low'
      WHEN (w.i % 20) < 9 THEN 'meets'
      WHEN (w.i % 20) < 17 THEN 'exceeds'
      ELSE 'exceptional'
    END AS performance_rating
  FROM with_role_level_location w
  LEFT JOIN market_comp mc
    ON mc.role_id = w.role_id
   AND mc.level_id = w.level_id
   AND mc.location_id = w.location_id
)
INSERT INTO employees (
  id, workspace_id, first_name, last_name, email, department, role_id, level_id, location_id,
  base_salary, bonus, equity, currency, status, employment_type, hire_date, last_review_date, performance_rating
)
SELECT
  id, workspace_id, first_name, last_name, email, department, role_id, level_id, location_id,
  base_salary, bonus, equity, currency, status, employment_type, hire_date, last_review_date, performance_rating
FROM prepared
WHERE workspace_id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
  workspace_id = EXCLUDED.workspace_id,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  department = EXCLUDED.department,
  role_id = EXCLUDED.role_id,
  level_id = EXCLUDED.level_id,
  location_id = EXCLUDED.location_id,
  base_salary = EXCLUDED.base_salary,
  bonus = EXCLUDED.bonus,
  equity = EXCLUDED.equity,
  currency = EXCLUDED.currency,
  status = EXCLUDED.status,
  employment_type = EXCLUDED.employment_type,
  hire_date = EXCLUDED.hire_date,
  last_review_date = EXCLUDED.last_review_date,
  performance_rating = EXCLUDED.performance_rating,
  updated_at = now();

-- 3) Salary benchmarks for every role/level/location tuple present
WITH ws AS (
  SELECT id AS workspace_id FROM workspaces WHERE slug = 'experrt-demo' LIMIT 1
), tuples AS (
  SELECT
    e.workspace_id,
    e.role_id,
    e.level_id,
    e.location_id,
    e.currency,
    avg((coalesce(e.base_salary,0) + coalesce(e.bonus,0) + coalesce(e.equity,0)) / 12.0)::numeric AS avg_monthly_total,
    count(*)::int AS sample_size
  FROM employees e
  WHERE e.workspace_id = (SELECT workspace_id FROM ws)
  GROUP BY e.workspace_id, e.role_id, e.level_id, e.location_id, e.currency
)
INSERT INTO salary_benchmarks (
  workspace_id, role_id, level_id, location_id, currency,
  p10, p25, p50, p75, p90, sample_size, source, confidence, valid_from
)
SELECT
  t.workspace_id,
  t.role_id,
  t.level_id,
  t.location_id,
  t.currency,
  round(t.avg_monthly_total * 0.70)::numeric AS p10,
  round(t.avg_monthly_total * 0.83)::numeric AS p25,
  round(t.avg_monthly_total * 1.00)::numeric AS p50,
  round(t.avg_monthly_total * 1.18)::numeric AS p75,
  round(t.avg_monthly_total * 1.35)::numeric AS p90,
  greatest(t.sample_size, 20) AS sample_size,
  'uploaded'::text AS source,
  CASE WHEN t.sample_size >= 8 THEN 'high' ELSE 'medium' END::text AS confidence,
  CURRENT_DATE AS valid_from
FROM tuples t
ON CONFLICT (workspace_id, role_id, location_id, level_id, valid_from) DO UPDATE SET
  currency = EXCLUDED.currency,
  p10 = EXCLUDED.p10,
  p25 = EXCLUDED.p25,
  p50 = EXCLUDED.p50,
  p75 = EXCLUDED.p75,
  p90 = EXCLUDED.p90,
  sample_size = EXCLUDED.sample_size,
  source = EXCLUDED.source,
  confidence = EXCLUDED.confidence;

-- 4) Compensation history (3 snapshots per employee)
WITH ws AS (
  SELECT id AS workspace_id FROM workspaces WHERE slug = 'experrt-demo' LIMIT 1
), emps AS (
  SELECT
    e.id,
    e.currency,
    e.hire_date,
    coalesce(e.base_salary,0)::numeric AS base_salary,
    coalesce(e.bonus,0)::numeric AS bonus,
    coalesce(e.equity,0)::numeric AS equity
  FROM employees e
  WHERE e.workspace_id = (SELECT workspace_id FROM ws)
)
INSERT INTO compensation_history (
  id, employee_id, effective_date, base_salary, bonus, equity, currency, change_reason, change_percentage
)
SELECT
  (
    substr(md5(emps.id::text || '-hist-' || step.step_no),1,8) || '-' ||
    substr(md5(emps.id::text || '-hist-' || step.step_no),9,4) || '-4' ||
    substr(md5(emps.id::text || '-hist-' || step.step_no),14,3) || '-a' ||
    substr(md5(emps.id::text || '-hist-' || step.step_no),18,3) || '-' ||
    substr(md5(emps.id::text || '-hist-' || step.step_no),21,12)
  )::uuid AS id,
  emps.id AS employee_id,
  CASE
    WHEN step.step_no = 1 THEN least(CURRENT_DATE, greatest(emps.hire_date, CURRENT_DATE - interval '6 years')::date)
    WHEN step.step_no = 2 THEN least(CURRENT_DATE, greatest(emps.hire_date + interval '18 months', CURRENT_DATE - interval '2 years')::date)
    ELSE least(CURRENT_DATE, greatest(emps.hire_date + interval '42 months', CURRENT_DATE - interval '90 days')::date)
  END AS effective_date,
  round(emps.base_salary * step.base_factor)::numeric AS base_salary,
  round(emps.bonus * step.bonus_factor)::numeric AS bonus,
  round(emps.equity * step.equity_factor)::numeric AS equity,
  emps.currency,
  step.reason AS change_reason,
  step.change_pct AS change_percentage
FROM emps
CROSS JOIN (
  VALUES
    (1, 'hire'::text, 0.74::numeric, 0.50::numeric, 0.35::numeric, 0::numeric),
    (2, 'annual-review'::text, 0.88::numeric, 0.78::numeric, 0.70::numeric, 12::numeric),
    (3, 'market-adjustment'::text, 1.00::numeric, 1.00::numeric, 1.00::numeric, 6::numeric)
) AS step(step_no, reason, base_factor, bonus_factor, equity_factor, change_pct)
ON CONFLICT (id) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  effective_date = EXCLUDED.effective_date,
  base_salary = EXCLUDED.base_salary,
  bonus = EXCLUDED.bonus,
  equity = EXCLUDED.equity,
  currency = EXCLUDED.currency,
  change_reason = EXCLUDED.change_reason,
  change_percentage = EXCLUDED.change_percentage;

-- 5) Compliance domain tables
-- Bootstrap-only demo seed for local testing. In production, tenant imports and integrations
-- should remain the system-of-record that populates these compliance tables.
WITH ws AS (
  SELECT id AS workspace_id FROM workspaces WHERE slug = 'experrt-demo' LIMIT 1
), dept_stats AS (
  SELECT
    e.department,
    count(*)::int AS headcount,
    avg(
      CASE e.performance_rating
        WHEN 'low' THEN 62
        WHEN 'meets' THEN 82
        WHEN 'exceeds' THEN 91
        ELSE 97
      END
    )::numeric AS perf_score
  FROM employees e
  WHERE e.workspace_id = (SELECT workspace_id FROM ws)
  GROUP BY e.department
), ranked AS (
  SELECT
    department,
    headcount,
    perf_score,
    row_number() OVER (ORDER BY headcount DESC, department) AS rn
  FROM dept_stats
)
INSERT INTO compliance_policies (workspace_id, name, completion_rate, status, due_date, data_source)
SELECT
  (SELECT workspace_id FROM ws) AS workspace_id,
  CASE (r.rn - 1) % 4
    WHEN 0 THEN initcap(r.department) || ' Sign-off Controls'
    WHEN 1 THEN initcap(r.department) || ' Documentation Standard'
    WHEN 2 THEN initcap(r.department) || ' Escalation Workflow'
    ELSE initcap(r.department) || ' Risk Monitoring SOP'
  END AS name,
  least(99, greatest(68, round(r.perf_score - (r.rn * 1.7), 1)))::numeric(5,2) AS completion_rate,
  CASE
    WHEN least(99, greatest(68, round(r.perf_score - (r.rn * 1.7), 1))) >= 93 THEN 'Success'
    WHEN least(99, greatest(68, round(r.perf_score - (r.rn * 1.7), 1))) >= 84 THEN 'Pending'
    ELSE 'Critical'
  END AS status,
  (CURRENT_DATE + ((6 + (r.rn * 5))::int))::date AS due_date,
  'seed'::text AS data_source
FROM ranked r
WHERE (SELECT workspace_id FROM ws) IS NOT NULL
LIMIT 8;

WITH ws AS (
  SELECT id AS workspace_id FROM workspaces WHERE slug = 'experrt-demo' LIMIT 1
), location_stats AS (
  SELECT
    e.location_id,
    count(*)::int AS headcount,
    row_number() OVER (ORDER BY count(*) DESC, e.location_id) AS rn
  FROM employees e
  WHERE e.workspace_id = (SELECT workspace_id FROM ws)
  GROUP BY e.location_id
)
INSERT INTO compliance_regulatory_updates (
  workspace_id, title, description, published_date, status, impact, jurisdiction, data_source
)
SELECT
  (SELECT workspace_id FROM ws) AS workspace_id,
  CASE (ls.rn - 1) % 4
    WHEN 0 THEN jurisdiction || ' Labor Circular Update'
    WHEN 1 THEN jurisdiction || ' Permit Compliance Clarification'
    WHEN 2 THEN jurisdiction || ' Payroll Reporting Amendment'
    ELSE jurisdiction || ' Employment Contract Guidance'
  END AS title,
  'Review for ' || ls.headcount || ' active employees in ' || jurisdiction || ' location groups.' AS description,
  (CURRENT_DATE - (((ls.rn * 3) + 2)::int))::date AS published_date,
  CASE ls.rn % 3
    WHEN 1 THEN 'Active'
    WHEN 2 THEN 'Pending'
    ELSE 'Review'
  END AS status,
  CASE
    WHEN ls.headcount >= 14 THEN 'High'
    WHEN ls.headcount >= 9 THEN 'Medium'
    ELSE 'Low'
  END AS impact,
  jurisdiction,
  'seed'::text AS data_source
FROM (
  SELECT
    ls.*,
    CASE ls.location_id
      WHEN 'dubai' THEN 'UAE'
      WHEN 'abu-dhabi' THEN 'UAE'
      WHEN 'riyadh' THEN 'KSA'
      WHEN 'jeddah' THEN 'KSA'
      WHEN 'doha' THEN 'Qatar'
      WHEN 'manama' THEN 'Bahrain'
      WHEN 'kuwait-city' THEN 'Kuwait'
      WHEN 'muscat' THEN 'Oman'
      ELSE 'UAE'
    END AS jurisdiction
  FROM location_stats ls
) ls
WHERE (SELECT workspace_id FROM ws) IS NOT NULL
LIMIT 8;

WITH ws AS (
  SELECT id AS workspace_id FROM workspaces WHERE slug = 'experrt-demo' LIMIT 1
), dept_pool AS (
  SELECT
    array_agg(department ORDER BY headcount DESC, department) AS departments
  FROM (
    SELECT e.department, count(*)::int AS headcount
    FROM employees e
    WHERE e.workspace_id = (SELECT workspace_id FROM ws)
    GROUP BY e.department
  ) d
)
INSERT INTO compliance_deadlines (workspace_id, due_at, title, type, status, data_source)
SELECT
  (SELECT workspace_id FROM ws) AS workspace_id,
  (CURRENT_DATE + (((g.i * 5) - 8)::int))::date AS due_at,
  initcap(
    (SELECT departments[((g.i - 1) % array_length(departments, 1)) + 1] FROM dept_pool)
  ) || ' compliance checkpoint #' || lpad(g.i::text, 2, '0') AS title,
  CASE g.i % 3
    WHEN 1 THEN 'Urgent'
    WHEN 2 THEN 'Regular'
    ELSE 'Mandatory'
  END AS type,
  CASE
    WHEN (CURRENT_DATE + (((g.i * 5) - 8)::int))::date < CURRENT_DATE THEN 'overdue'
    WHEN g.i % 5 = 0 THEN 'done'
    ELSE 'open'
  END AS status,
  'seed'::text AS data_source
FROM generate_series(1, 10) AS g(i)
WHERE (SELECT workspace_id FROM ws) IS NOT NULL
  AND coalesce((SELECT array_length(departments, 1) FROM dept_pool), 0) > 0;

WITH ws AS (
  SELECT id AS workspace_id FROM workspaces WHERE slug = 'experrt-demo' LIMIT 1
), expats AS (
  SELECT
    e.id,
    e.first_name,
    e.last_name,
    e.department,
    e.role_id,
    row_number() OVER (ORDER BY e.hire_date, e.id) AS rn
  FROM employees e
  WHERE e.workspace_id = (SELECT workspace_id FROM ws)
    AND e.employment_type = 'expat'
)
INSERT INTO compliance_visa_cases (workspace_id, employee_id, title, description, status, expires_on, data_source)
SELECT
  (SELECT workspace_id FROM ws),
  e.id,
  'Permit review - ' || e.first_name || ' ' || e.last_name,
  initcap(e.department) || ' / ' || upper(e.role_id) || ' sponsorship workflow tracking.',
  CASE
    WHEN e.rn % 11 IN (0, 4) THEN 'overdue'
    WHEN e.rn % 11 IN (2, 5, 8) THEN 'expiring'
    WHEN e.rn % 11 IN (3, 7) THEN 'open_case'
    ELSE 'active'
  END AS status,
  CASE
    WHEN e.rn % 11 IN (0, 4) THEN (CURRENT_DATE - ((2 + (e.rn % 14))::int))::date
    WHEN e.rn % 11 IN (2, 5, 8) THEN (CURRENT_DATE + ((4 + (e.rn % 22))::int))::date
    WHEN e.rn % 11 IN (3, 7) THEN (CURRENT_DATE + ((18 + (e.rn % 36))::int))::date
    ELSE (CURRENT_DATE + ((45 + (e.rn % 160))::int))::date
  END AS expires_on,
  'seed'::text AS data_source
FROM expats e
WHERE (SELECT workspace_id FROM ws) IS NOT NULL
LIMIT 20;

WITH ws AS (
  SELECT id AS workspace_id FROM workspaces WHERE slug = 'experrt-demo' LIMIT 1
), dept_stats AS (
  SELECT
    e.department,
    count(*)::int AS headcount,
    row_number() OVER (ORDER BY count(*) DESC, e.department) AS rn
  FROM employees e
  WHERE e.workspace_id = (SELECT workspace_id FROM ws)
  GROUP BY e.department
)
INSERT INTO compliance_documents (workspace_id, name, doc_type, expiry_date, status, size_bytes, data_source)
SELECT
  (SELECT workspace_id FROM ws) AS workspace_id,
  initcap(ds.department) || ' ' ||
    CASE ds.rn % 5
      WHEN 1 THEN 'License Pack'
      WHEN 2 THEN 'Permit Register'
      WHEN 3 THEN 'Policy Binder'
      WHEN 4 THEN 'Contract Archive'
      ELSE 'Certificate Bundle'
    END AS name,
  CASE ds.rn % 6
    WHEN 1 THEN 'License'
    WHEN 2 THEN 'Permit'
    WHEN 3 THEN 'Policy'
    WHEN 4 THEN 'Contract'
    WHEN 5 THEN 'Registration'
    ELSE 'Certificate'
  END AS doc_type,
  (CURRENT_DATE + ((12 + (ds.rn * 17))::int))::date AS expiry_date,
  CASE
    WHEN (CURRENT_DATE + ((12 + (ds.rn * 17))::int))::date <= CURRENT_DATE + 45 THEN 'Expiring'
    WHEN (CURRENT_DATE + ((12 + (ds.rn * 17))::int))::date >= CURRENT_DATE + 120 THEN 'Active'
    ELSE 'Review'
  END AS status,
  (550000 + (ds.rn * 175000) + (ds.headcount * 22000))::bigint AS size_bytes,
  'seed'::text AS data_source
FROM dept_stats ds
WHERE (SELECT workspace_id FROM ws) IS NOT NULL
LIMIT 10;

WITH ws AS (
  SELECT id AS workspace_id FROM workspaces WHERE slug = 'experrt-demo' LIMIT 1
), policy_events AS (
  SELECT
    'policy'::text AS icon_type,
    name::text AS target,
    row_number() OVER (ORDER BY due_date, name) AS rn
  FROM compliance_policies
  WHERE workspace_id = (SELECT workspace_id FROM ws)
), document_events AS (
  SELECT
    'document'::text AS icon_type,
    name::text AS target,
    100 + row_number() OVER (ORDER BY expiry_date, name) AS rn
  FROM compliance_documents
  WHERE workspace_id = (SELECT workspace_id FROM ws)
), deadline_events AS (
  SELECT
    'risk'::text AS icon_type,
    title::text AS target,
    200 + row_number() OVER (ORDER BY due_at, title) AS rn
  FROM compliance_deadlines
  WHERE workspace_id = (SELECT workspace_id FROM ws)
), visa_events AS (
  SELECT
    'user'::text AS icon_type,
    title::text AS target,
    300 + row_number() OVER (ORDER BY expires_on, title) AS rn
  FROM compliance_visa_cases
  WHERE workspace_id = (SELECT workspace_id FROM ws)
), event_sources AS (
  SELECT * FROM policy_events WHERE rn <= 4
  UNION ALL
  SELECT * FROM document_events WHERE rn <= 4
  UNION ALL
  SELECT * FROM deadline_events WHERE rn <= 4
  UNION ALL
  SELECT * FROM visa_events WHERE rn <= 4
), ordered AS (
  SELECT
    icon_type,
    target,
    row_number() OVER (ORDER BY rn, target) AS seq
  FROM event_sources
)
INSERT INTO compliance_audit_events (workspace_id, action, target, actor, icon_type, metadata, event_time, data_source)
SELECT
  (SELECT workspace_id FROM ws) AS workspace_id,
  CASE o.seq % 6
    WHEN 1 THEN 'Updated'
    WHEN 2 THEN 'Reviewed'
    WHEN 3 THEN 'Assigned'
    WHEN 4 THEN 'Generated'
    WHEN 5 THEN 'Escalated'
    ELSE 'Approved'
  END AS action,
  o.target,
  CASE o.icon_type
    WHEN 'policy' THEN 'People Ops'
    WHEN 'document' THEN 'Compliance Lead'
    WHEN 'risk' THEN 'Risk Manager'
    ELSE 'Mobility Specialist'
  END AS actor,
  o.icon_type,
  jsonb_build_object(
    'seed_origin', 'bootstrap_demo',
    'entity_type', o.icon_type
  ) AS metadata,
  (now() - ((o.seq * 4 + 1) || ' hours')::interval) AS event_time,
  'seed'::text AS data_source
FROM ordered o
WHERE (SELECT workspace_id FROM ws) IS NOT NULL
LIMIT 16;
