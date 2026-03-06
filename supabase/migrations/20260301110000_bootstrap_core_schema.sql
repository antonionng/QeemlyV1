-- Bootstrap core schema required by later migrations.
-- This keeps local `supabase start/db reset` resilient even when historical
-- base schema setup was applied outside versioned migrations.

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  employee_id UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE,
  department TEXT,
  role_id TEXT,
  level_id TEXT,
  location_id TEXT,
  base_salary NUMERIC(12,2),
  bonus NUMERIC(12,2),
  equity NUMERIC(12,2),
  currency TEXT,
  status TEXT DEFAULT 'active',
  employment_type TEXT,
  hire_date DATE,
  last_review_date DATE,
  performance_rating TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS salary_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL,
  level_id TEXT NOT NULL,
  location_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  p10 NUMERIC(12,2),
  p25 NUMERIC(12,2),
  p50 NUMERIC(12,2),
  p75 NUMERIC(12,2),
  p90 NUMERIC(12,2),
  sample_size INTEGER,
  source TEXT DEFAULT 'uploaded',
  confidence TEXT DEFAULT 'medium',
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, role_id, location_id, level_id, valid_from)
);

CREATE TABLE IF NOT EXISTS compensation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL,
  base_salary NUMERIC(12,2) DEFAULT 0,
  bonus NUMERIC(12,2) DEFAULT 0,
  equity NUMERIC(12,2) DEFAULT 0,
  currency TEXT,
  change_reason TEXT,
  change_percentage NUMERIC(8,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspace_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  company_name TEXT,
  company_logo TEXT,
  company_website TEXT,
  company_description TEXT,
  primary_color TEXT DEFAULT '#5C45FD',
  industry TEXT,
  company_size TEXT,
  funding_stage TEXT,
  headquarters_country TEXT,
  headquarters_city TEXT,
  target_percentile INTEGER DEFAULT 50,
  review_cycle TEXT DEFAULT 'annual',
  default_currency TEXT DEFAULT 'AED',
  fiscal_year_start INTEGER DEFAULT 1,
  default_bonus_percentage NUMERIC DEFAULT 15,
  equity_vesting_schedule TEXT DEFAULT '4-year-1-cliff',
  benefits_tier TEXT DEFAULT 'standard',
  comp_split_basic_pct NUMERIC DEFAULT 60,
  comp_split_housing_pct NUMERIC DEFAULT 25,
  comp_split_transport_pct NUMERIC DEFAULT 10,
  comp_split_other_pct NUMERIC DEFAULT 5,
  is_configured BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected',
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  sync_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ingestion_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  regions TEXT[] DEFAULT ARRAY[]::TEXT[],
  license_url TEXT,
  terms_summary TEXT,
  approved_for_commercial BOOLEAN NOT NULL DEFAULT false,
  needs_review BOOLEAN NOT NULL DEFAULT true,
  update_cadence TEXT DEFAULT 'weekly',
  expected_fields JSONB DEFAULT '[]'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
