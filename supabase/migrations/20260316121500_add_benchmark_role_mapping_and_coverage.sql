ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS original_role_text TEXT,
  ADD COLUMN IF NOT EXISTS original_level_text TEXT,
  ADD COLUMN IF NOT EXISTS canonical_role_id TEXT,
  ADD COLUMN IF NOT EXISTS role_mapping_confidence TEXT,
  ADD COLUMN IF NOT EXISTS role_mapping_source TEXT,
  ADD COLUMN IF NOT EXISTS role_mapping_status TEXT;

ALTER TABLE salary_benchmarks
  ADD COLUMN IF NOT EXISTS canonical_role_id TEXT,
  ADD COLUMN IF NOT EXISTS role_mapping_confidence TEXT,
  ADD COLUMN IF NOT EXISTS role_mapping_source TEXT;

CREATE TABLE IF NOT EXISTS canonical_roles (
  id TEXT PRIMARY KEY,
  family TEXT NOT NULL,
  title TEXT NOT NULL,
  benchmark_role_key TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_benchmarkable BOOLEAN NOT NULL DEFAULT true,
  default_level_strategy TEXT NOT NULL DEFAULT 'exact',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS canonical_role_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_role_id TEXT NOT NULL REFERENCES canonical_roles(id) ON DELETE CASCADE,
  alias_text TEXT NOT NULL,
  alias_normalized TEXT NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  source_kind TEXT NOT NULL DEFAULT 'qeemly_default',
  confidence_default TEXT NOT NULL DEFAULT 'high',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_canonical_role_aliases_unique_active
ON canonical_role_aliases (COALESCE(workspace_id, '00000000-0000-0000-0000-000000000000'::uuid), alias_normalized, canonical_role_id);

CREATE TABLE IF NOT EXISTS role_mapping_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  original_role_text TEXT NOT NULL,
  proposed_canonical_role_id TEXT REFERENCES canonical_roles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  review_reason TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_role_mapping_reviews_workspace_status
ON role_mapping_reviews (workspace_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS benchmark_coverage_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  employee_count INTEGER NOT NULL DEFAULT 0,
  exact_match_count INTEGER NOT NULL DEFAULT 0,
  fallback_match_count INTEGER NOT NULL DEFAULT 0,
  unresolved_count INTEGER NOT NULL DEFAULT 0,
  low_confidence_count INTEGER NOT NULL DEFAULT 0,
  market_coverage_rate INTEGER NOT NULL DEFAULT 0,
  coverage_by_family JSONB NOT NULL DEFAULT '{}'::jsonb,
  coverage_by_country JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO canonical_roles (id, family, title, benchmark_role_key)
VALUES
  ('swe', 'Engineering', 'Software Engineer', 'engineering_software_engineer'),
  ('swe-fe', 'Engineering', 'Frontend Engineer', 'engineering_frontend_engineer'),
  ('swe-be', 'Engineering', 'Backend Engineer', 'engineering_backend_engineer'),
  ('swe-mobile', 'Engineering', 'Mobile Engineer', 'engineering_mobile_engineer'),
  ('swe-devops', 'Engineering', 'DevOps Engineer', 'engineering_devops_engineer'),
  ('swe-data', 'Engineering', 'Data Engineer', 'engineering_data_engineer'),
  ('swe-ml', 'Engineering', 'ML Engineer', 'engineering_ml_engineer'),
  ('pm', 'Product', 'Product Manager', 'product_product_manager'),
  ('tpm', 'Product', 'Technical PM', 'product_technical_pm'),
  ('designer', 'Design', 'Product Designer', 'design_product_designer'),
  ('ux-researcher', 'Design', 'UX Researcher', 'design_ux_researcher'),
  ('data-scientist', 'Data', 'Data Scientist', 'data_data_scientist'),
  ('data-analyst', 'Data', 'Data Analyst', 'data_data_analyst'),
  ('security', 'Engineering', 'Security Engineer', 'engineering_security_engineer'),
  ('qa', 'Engineering', 'QA Engineer', 'engineering_qa_engineer')
ON CONFLICT (id) DO UPDATE
SET
  family = EXCLUDED.family,
  title = EXCLUDED.title,
  benchmark_role_key = EXCLUDED.benchmark_role_key,
  updated_at = now();

INSERT INTO canonical_role_aliases (canonical_role_id, alias_text, alias_normalized, workspace_id, source_kind)
VALUES
  ('swe', 'Software Engineer', 'software engineer', NULL, 'qeemly_default'),
  ('swe-fe', 'Frontend Engineer', 'frontend engineer', NULL, 'qeemly_default'),
  ('swe-be', 'Backend Engineer', 'backend engineer', NULL, 'qeemly_default'),
  ('swe-mobile', 'Mobile Engineer', 'mobile engineer', NULL, 'qeemly_default'),
  ('swe-devops', 'DevOps Engineer', 'devops engineer', NULL, 'qeemly_default'),
  ('swe-data', 'Data Engineer', 'data engineer', NULL, 'qeemly_default'),
  ('swe-ml', 'ML Engineer', 'ml engineer', NULL, 'qeemly_default'),
  ('pm', 'Product Manager', 'product manager', NULL, 'qeemly_default'),
  ('tpm', 'Technical PM', 'technical pm', NULL, 'qeemly_default'),
  ('designer', 'Product Designer', 'product designer', NULL, 'qeemly_default'),
  ('ux-researcher', 'UX Researcher', 'ux researcher', NULL, 'qeemly_default'),
  ('data-scientist', 'Data Scientist', 'data scientist', NULL, 'qeemly_default'),
  ('data-analyst', 'Data Analyst', 'data analyst', NULL, 'qeemly_default'),
  ('security', 'Security Engineer', 'security engineer', NULL, 'qeemly_default'),
  ('qa', 'QA Engineer', 'qa engineer', NULL, 'qeemly_default')
ON CONFLICT DO NOTHING;
