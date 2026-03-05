/*
  SEED USER FOR DEMO
  
  To create the demo user, go to your Supabase Dashboard:
  1. Navigate to Authentication > Users
  2. Click "Add user" button
  3. Enter:
     - Email: ag@experrt.com
     - Password: Generate a one-time strong password in your password manager
  4. Click "Create user"
  
  Then run the SQL below to create their workspace and profile:
*/

-- Create workspace for the demo user
INSERT INTO workspaces (id, name, slug)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Experrt',
  'experrt-demo'
)
ON CONFLICT (slug) DO NOTHING;

-- Get the user ID from auth.users and create their profile
-- Note: Replace 'USER_ID_HERE' with the actual UUID from the Authentication tab
-- after creating the user manually

-- Example (you'll need to update the UUID after creating the user):
/*
INSERT INTO profiles (id, workspace_id, full_name, role)
VALUES (
  'USER_ID_HERE',  -- Copy from Authentication > Users after creating the user
  'a0000000-0000-0000-0000-000000000001',
  'Demo User',
  'admin'
);
*/

-- Seed baseline employees + compensation history for experrt-demo tenant.
-- Idempotent: fixed UUIDs + ON CONFLICT updates.
WITH experrt_workspace AS (
  SELECT id
  FROM workspaces
  WHERE slug = 'experrt-demo'
  LIMIT 1
)
INSERT INTO employees (
  id,
  workspace_id,
  first_name,
  last_name,
  email,
  department,
  role_id,
  level_id,
  location_id,
  base_salary,
  bonus,
  equity,
  currency,
  status,
  employment_type,
  hire_date,
  last_review_date,
  performance_rating
)
SELECT * FROM (
  SELECT
    'a1000000-0000-0000-0000-000000000001'::uuid AS id,
    (SELECT id FROM experrt_workspace) AS workspace_id,
    'Ahmed' AS first_name,
    'Al-Dosari' AS last_name,
    'ahmed.al-dosari@experrt.com' AS email,
    'Product' AS department,
    'pm' AS role_id,
    'ic4' AS level_id,
    'manama' AS location_id,
    229700 AS base_salary,
    22000 AS bonus,
    18000 AS equity,
    'AED' AS currency,
    'active' AS status,
    'national' AS employment_type,
    DATE '2020-11-01' AS hire_date,
    DATE '2025-11-01' AS last_review_date,
    'exceeds' AS performance_rating
  UNION ALL
  SELECT
    'a1000000-0000-0000-0000-000000000002'::uuid,
    (SELECT id FROM experrt_workspace),
    'Sabah',
    'Khan',
    'sabah.khan@experrt.com',
    'Engineering',
    'swe-be',
    'ic5',
    'dubai',
    191100,
    20000,
    12000,
    'AED',
    'active',
    'expat',
    DATE '2021-10-01',
    DATE '2025-10-01',
    'exceptional'
  UNION ALL
  SELECT
    'a1000000-0000-0000-0000-000000000003'::uuid,
    (SELECT id FROM experrt_workspace),
    'Rashid',
    'Hassan',
    'rashid.hassan@experrt.com',
    'Design',
    'designer',
    'ic3',
    'abu-dhabi',
    183300,
    16000,
    8000,
    'AED',
    'active',
    'national',
    DATE '2022-10-01',
    DATE '2025-10-01',
    'meets'
) seeded_employees
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

INSERT INTO compensation_history (
  id,
  employee_id,
  effective_date,
  base_salary,
  bonus,
  equity,
  currency,
  change_reason,
  change_percentage
)
VALUES
  -- Ahmed
  ('a2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', DATE '2020-11-01', 158300, 10000, 5000, 'AED', 'hire', 0),
  ('a2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', DATE '2022-11-01', 175000, 13000, 8000, 'AED', 'annual-review', 10.5),
  ('a2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', DATE '2024-11-01', 225000, 20000, 15000, 'AED', 'promotion', 28.6),
  ('a2000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', DATE '2025-11-01', 229700, 22000, 18000, 'AED', 'market-adjustment', 2.1),

  -- Sabah
  ('a2000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', DATE '2021-10-01', 146000, 10000, 3000, 'AED', 'hire', 0),
  ('a2000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002', DATE '2023-10-01', 165500, 13000, 7000, 'AED', 'annual-review', 13.4),
  ('a2000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000002', DATE '2025-10-01', 191100, 20000, 12000, 'AED', 'promotion', 15.5),

  -- Rashid
  ('a2000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000003', DATE '2022-10-01', 150000, 10000, 3000, 'AED', 'hire', 0),
  ('a2000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000003', DATE '2024-10-01', 172000, 13000, 6000, 'AED', 'annual-review', 14.7),
  ('a2000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000003', DATE '2025-10-01', 183300, 16000, 8000, 'AED', 'market-adjustment', 6.6)
ON CONFLICT (id) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  effective_date = EXCLUDED.effective_date,
  base_salary = EXCLUDED.base_salary,
  bonus = EXCLUDED.bonus,
  equity = EXCLUDED.equity,
  currency = EXCLUDED.currency,
  change_reason = EXCLUDED.change_reason,
  change_percentage = EXCLUDED.change_percentage;

-- Seed salary benchmarks for experrt workspace (role/location/level tuples used across dashboards).
WITH experrt_workspace AS (
  SELECT id
  FROM workspaces
  WHERE slug = 'experrt-demo'
  LIMIT 1
)
INSERT INTO salary_benchmarks (
  workspace_id,
  role_id,
  level_id,
  location_id,
  currency,
  p10,
  p25,
  p50,
  p75,
  p90,
  sample_size,
  source,
  confidence,
  valid_from
)
SELECT * FROM (
  SELECT
    (SELECT id FROM experrt_workspace) AS workspace_id,
    'swe-be'::text AS role_id,
    'ic5'::text AS level_id,
    'dubai'::text AS location_id,
    'AED'::text AS currency,
    21500::numeric AS p10,
    25500::numeric AS p25,
    30200::numeric AS p50,
    36800::numeric AS p75,
    42500::numeric AS p90,
    87::int AS sample_size,
    'market-ingestion'::text AS source,
    'High'::text AS confidence,
    CURRENT_DATE - 7 AS valid_from
  UNION ALL
  SELECT
    (SELECT id FROM experrt_workspace), 'pm', 'ic4', 'dubai', 'AED',
    20500, 24500, 29600, 35100, 40900, 76, 'market-ingestion', 'High', CURRENT_DATE - 7
  UNION ALL
  SELECT
    (SELECT id FROM experrt_workspace), 'designer', 'ic3', 'abu-dhabi', 'AED',
    16500, 19800, 23800, 28400, 32700, 64, 'market-ingestion', 'Medium', CURRENT_DATE - 7
  UNION ALL
  SELECT
    (SELECT id FROM experrt_workspace), 'data-scientist', 'ic4', 'riyadh', 'SAR',
    19000, 23000, 28100, 33600, 40200, 58, 'market-ingestion', 'Medium', CURRENT_DATE - 7
) seeded_benchmarks
WHERE workspace_id IS NOT NULL
ON CONFLICT (workspace_id, role_id, location_id, level_id, valid_from) DO UPDATE SET
  currency = EXCLUDED.currency,
  p10 = EXCLUDED.p10,
  p25 = EXCLUDED.p25,
  p50 = EXCLUDED.p50,
  p75 = EXCLUDED.p75,
  p90 = EXCLUDED.p90,
  sample_size = EXCLUDED.sample_size,
  source = EXCLUDED.source,
  confidence = EXCLUDED.confidence,
  updated_at = now();

-- Seed compliance snapshot consumed by compliance page.
WITH experrt_workspace AS (
  SELECT id
  FROM workspaces
  WHERE slug = 'experrt-demo'
  LIMIT 1
)
INSERT INTO compliance_snapshots (
  workspace_id,
  compliance_score,
  risk_items,
  pay_equity_kpis,
  equity_levels,
  policy_items,
  regulatory_updates,
  deadline_items,
  visa_stats,
  visa_timeline,
  document_items,
  audit_log_items
)
SELECT
  (SELECT id FROM experrt_workspace),
  94.6,
  '[
    {"id":"risk-1","area":"Labour Contract Registry","level":68,"status":"High","description":"A subset of records need refreshed contract addenda."},
    {"id":"risk-2","area":"WPS Transfer Timeliness","level":34,"status":"Moderate","description":"Payroll transfer SLA is stable but should remain monitored."},
    {"id":"risk-3","area":"Work Permit Renewals","level":23,"status":"Low","description":"Permit renewals are on track across active entities."}
  ]'::jsonb,
  '[
    {"id":"pek1","label":"Gender Pay Gap","value":"2.4%","subtitle":"within target","delta":"-0.8","deltaDirection":"down"},
    {"id":"pek2","label":"Equity Score","value":"91.2","subtitle":"target >= 90"},
    {"id":"pek3","label":"Audited Roles","value":"24","subtitle":"quarter to date"}
  ]'::jsonb,
  '[
    {"level":"IC3","gap":"2.1%","barPercent":58,"direction":"down"},
    {"level":"IC4","gap":"2.8%","barPercent":62,"direction":"down"},
    {"level":"M1","gap":"3.4%","barPercent":66,"direction":"neutral"}
  ]'::jsonb,
  '[
    {"id":"pol-1","name":"Offer Approval Policy","rate":96,"status":"Success"},
    {"id":"pol-2","name":"Compensation Change SOP","rate":91,"status":"Pending"},
    {"id":"pol-3","name":"Visa Sponsorship Policy","rate":88,"status":"Pending"}
  ]'::jsonb,
  '[
    {"id":"reg-1","title":"UAE End-of-Service Clarification","description":"Updated interpretation published for fixed-term contracts.","date":"2026-02-18","status":"Active","impact":"Medium","jurisdiction":"UAE"},
    {"id":"reg-2","title":"KSA Employment Contract Update","description":"Template clauses updated for probation wording.","date":"2026-02-11","status":"Review","impact":"Low","jurisdiction":"KSA"}
  ]'::jsonb,
  '[
    {"id":"ddl-1","date":"Mar 12","title":"Quarterly wage compliance filing","type":"Mandatory"},
    {"id":"ddl-2","date":"Mar 20","title":"Permit renewal cohort B","type":"Urgent"}
  ]'::jsonb,
  '[
    {"label":"Active Permits","value":"41","color":"brand"},
    {"label":"Expiring <30d","value":"3","color":"amber"},
    {"label":"Overdue","value":"0","color":"emerald"},
    {"label":"Open Cases","value":"2","color":"red"}
  ]'::jsonb,
  '[
    {"id":"visa-1","title":"Renewal batch A submitted","description":"Submitted to PRO queue for review.","type":"Success"},
    {"id":"visa-2","title":"Medical test scheduling","description":"3 employees pending booking confirmation.","type":"Update"}
  ]'::jsonb,
  '[
    {"id":"doc-1","name":"Mainland Trade License","docType":"License","expiry":"2026-06-30","status":"Active","size":"2.1 MB"},
    {"id":"doc-2","name":"Labour Establishment Card","docType":"Permit","expiry":"2026-04-14","status":"Expiring","size":"1.4 MB"}
  ]'::jsonb,
  '[
    {"id":"audit-1","action":"Updated","target":"Offer Approval Policy","user":"People Ops","time":"2h ago","iconType":"policy"},
    {"id":"audit-2","action":"Uploaded","target":"Labour Establishment Card","user":"Compliance Lead","time":"1d ago","iconType":"document"}
  ]'::jsonb
WHERE (SELECT id FROM experrt_workspace) IS NOT NULL
ON CONFLICT (workspace_id) DO UPDATE SET
  compliance_score = EXCLUDED.compliance_score,
  risk_items = EXCLUDED.risk_items,
  pay_equity_kpis = EXCLUDED.pay_equity_kpis,
  equity_levels = EXCLUDED.equity_levels,
  policy_items = EXCLUDED.policy_items,
  regulatory_updates = EXCLUDED.regulatory_updates,
  deadline_items = EXCLUDED.deadline_items,
  visa_stats = EXCLUDED.visa_stats,
  visa_timeline = EXCLUDED.visa_timeline,
  document_items = EXCLUDED.document_items,
  audit_log_items = EXCLUDED.audit_log_items,
  updated_at = now();

-- Seed relocation city cost records used by relocation calculator.
INSERT INTO relocation_city_costs (
  city_id, name, country, region, flag, col_index, rent, transport, food, utilities, other, currency, currency_symbol, source
)
VALUES
  ('dubai','Dubai','UAE','gcc','🇦🇪',100,9000,1100,2200,750,1500,'AED','د.إ','experrt-seed'),
  ('abu-dhabi','Abu Dhabi','UAE','gcc','🇦🇪',95,8200,1000,2100,700,1400,'AED','د.إ','experrt-seed'),
  ('riyadh','Riyadh','Saudi Arabia','gcc','🇸🇦',85,6500,900,1800,550,1300,'SAR','﷼','experrt-seed'),
  ('doha','Doha','Qatar','gcc','🇶🇦',105,9800,1200,2300,650,1600,'QAR','ر.ق','experrt-seed'),
  ('london','London','United Kingdom','europe','🇬🇧',145,12800,1650,2900,900,2200,'GBP','£','experrt-seed')
ON CONFLICT (city_id) DO UPDATE SET
  name = EXCLUDED.name,
  country = EXCLUDED.country,
  region = EXCLUDED.region,
  flag = EXCLUDED.flag,
  col_index = EXCLUDED.col_index,
  rent = EXCLUDED.rent,
  transport = EXCLUDED.transport,
  food = EXCLUDED.food,
  utilities = EXCLUDED.utilities,
  other = EXCLUDED.other,
  currency = EXCLUDED.currency,
  currency_symbol = EXCLUDED.currency_symbol,
  source = EXCLUDED.source,
  updated_at = now();

-- Seed workspace billing subscription + invoices.
WITH experrt_workspace AS (
  SELECT id FROM workspaces WHERE slug = 'experrt-demo' LIMIT 1
),
starter_plan AS (
  SELECT id FROM billing_plans WHERE code = 'starter' LIMIT 1
)
INSERT INTO workspace_billing_subscriptions (
  workspace_id,
  plan_id,
  status,
  billing_cycle,
  next_billing_at,
  payment_method_last4
)
SELECT
  (SELECT id FROM experrt_workspace),
  (SELECT id FROM starter_plan),
  'active',
  'monthly',
  now() + interval '14 days',
  '4242'
WHERE (SELECT id FROM experrt_workspace) IS NOT NULL
  AND (SELECT id FROM starter_plan) IS NOT NULL
ON CONFLICT (workspace_id) DO UPDATE SET
  plan_id = EXCLUDED.plan_id,
  status = EXCLUDED.status,
  billing_cycle = EXCLUDED.billing_cycle,
  next_billing_at = EXCLUDED.next_billing_at,
  payment_method_last4 = EXCLUDED.payment_method_last4,
  updated_at = now();

WITH experrt_workspace AS (
  SELECT id FROM workspaces WHERE slug = 'experrt-demo' LIMIT 1
),
sub AS (
  SELECT id FROM workspace_billing_subscriptions WHERE workspace_id = (SELECT id FROM experrt_workspace) LIMIT 1
)
INSERT INTO billing_invoices (
  workspace_id,
  subscription_id,
  invoice_number,
  amount,
  currency,
  status,
  issued_at,
  paid_at
)
SELECT
  (SELECT id FROM experrt_workspace),
  (SELECT id FROM sub),
  invoice_number,
  amount,
  'AED',
  'paid',
  issued_at,
  issued_at + interval '2 days'
FROM (
  VALUES
    ('INV-EXP-2026-01', 179::numeric, TIMESTAMPTZ '2026-01-01 00:00:00+00'),
    ('INV-EXP-2026-02', 179::numeric, TIMESTAMPTZ '2026-02-01 00:00:00+00'),
    ('INV-EXP-2026-03', 179::numeric, TIMESTAMPTZ '2026-03-01 00:00:00+00')
) seeded(invoice_number, amount, issued_at)
WHERE (SELECT id FROM experrt_workspace) IS NOT NULL
ON CONFLICT (workspace_id, invoice_number) DO UPDATE SET
  amount = EXCLUDED.amount,
  status = EXCLUDED.status,
  issued_at = EXCLUDED.issued_at,
  paid_at = EXCLUDED.paid_at,
  updated_at = now();

-- Seed public benchmark snapshot for marketing/search/preview pages.
WITH experrt_workspace AS (
  SELECT id FROM workspaces WHERE slug = 'experrt-demo' LIMIT 1
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
  (SELECT id FROM experrt_workspace),
  'swe-be',
  'Backend Engineer',
  'dubai',
  'Dubai, UAE',
  'ic3',
  'IC3',
  'AED',
  24500,
  30200,
  38700,
  42,
  '+1.2%',
  '+1.9%',
  '+2.4%',
  '+1.8%',
  true
WHERE (SELECT id FROM experrt_workspace) IS NOT NULL
ON CONFLICT DO NOTHING;
