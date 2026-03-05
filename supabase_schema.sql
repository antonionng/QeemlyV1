/*
  RUN THIS SQL IN YOUR SUPABASE SQL EDITOR
*/

-- 1. Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Profiles (Extends Auth.Users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id),
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member', -- 'admin', 'member', or 'employee'
  employee_id UUID, -- links employee-role users to their employee record
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Team Invitations
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES profiles(id),
  role TEXT DEFAULT 'member', -- 'member' or 'employee'
  token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'expired'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Datasets (Persisted Benchmarks)
CREATE TABLE IF NOT EXISTS user_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT, -- Reference to Supabase Storage
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Workspace Settings (Company-level configuration)
CREATE TABLE IF NOT EXISTS workspace_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
  -- Company Profile
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
  -- Compensation Defaults
  target_percentile INTEGER DEFAULT 50,
  review_cycle TEXT DEFAULT 'annual',
  default_currency TEXT DEFAULT 'GBP',
  fiscal_year_start INTEGER DEFAULT 1, -- Month (1-12)
  default_bonus_percentage NUMERIC DEFAULT 15,
  equity_vesting_schedule TEXT DEFAULT '4-year-1-cliff',
  benefits_tier TEXT DEFAULT 'standard',
  -- Metadata
  is_configured BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_settings ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS policy evaluation.
-- SECURITY DEFINER avoids recursive policy checks when policies need profile context.
CREATE OR REPLACE FUNCTION public.current_workspace_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1
$$;

-- Policies for Workspaces
DROP POLICY IF EXISTS "Users can view their own workspace" ON workspaces;
CREATE POLICY "Users can view their own workspace"
ON workspaces FOR SELECT
USING (id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- Policies for Profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all profiles in workspace" ON profiles;
CREATE POLICY "Admins can view all profiles in workspace"
ON profiles FOR SELECT
USING (
  public.current_user_role() = 'admin'
  AND workspace_id = public.current_workspace_id()
);

-- Allow all workspace members to see each other (for team list)
DROP POLICY IF EXISTS "Members can view profiles in same workspace" ON profiles;
CREATE POLICY "Members can view profiles in same workspace"
ON profiles FOR SELECT
USING (workspace_id = public.current_workspace_id());

-- Policies for Invitations
DROP POLICY IF EXISTS "Admins can manage invitations" ON team_invitations;
CREATE POLICY "Admins can manage invitations"
ON team_invitations FOR ALL
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for Datasets
DROP POLICY IF EXISTS "Users can manage their workspace datasets" ON user_datasets;
CREATE POLICY "Users can manage their workspace datasets"
ON user_datasets FOR ALL
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- Policies for Workspace Settings
DROP POLICY IF EXISTS "Users can view their workspace settings" ON workspace_settings;
CREATE POLICY "Users can view their workspace settings"
ON workspace_settings FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage workspace settings" ON workspace_settings;
CREATE POLICY "Admins can manage workspace settings"
ON workspace_settings FOR ALL
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- INSERT Policies (needed for signup flow)
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can create workspaces" ON workspaces;
CREATE POLICY "Authenticated users can create workspaces"
ON workspaces FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- STORAGE BUCKETS
-- Run this manually in Supabase Storage UI or via SQL if supported by your version
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('datasets', 'datasets', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true);

-- STORAGE POLICIES (run these after creating buckets)
-- For avatars bucket (public read, authenticated write)
/*
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
*/

-- For datasets bucket (workspace-scoped access)
/*
CREATE POLICY "Users can access workspace datasets"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'datasets' AND
  (storage.foldername(name))[2] IN (
    SELECT workspace_id::text FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can upload workspace datasets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'datasets' AND
  auth.role() = 'authenticated'
);
*/

-- ============================================================================
-- DATA UPLOAD TABLES
-- ============================================================================

-- 6. Employees - Store uploaded employee data
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  -- Personal info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  -- Role info
  department TEXT NOT NULL,
  role_id TEXT NOT NULL,
  level_id TEXT NOT NULL,
  location_id TEXT NOT NULL,
  -- Compensation
  base_salary NUMERIC NOT NULL,
  bonus NUMERIC,
  equity NUMERIC,
  currency TEXT DEFAULT 'GBP',
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  employment_type TEXT DEFAULT 'national' CHECK (employment_type IN ('national', 'expat')),
  hire_date DATE,
  last_review_date DATE,
  performance_rating TEXT CHECK (performance_rating IN ('low', 'meets', 'exceeds', 'exceptional')),
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Salary Benchmarks - Store uploaded benchmark data
CREATE TABLE IF NOT EXISTS salary_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  -- Key fields
  role_id TEXT NOT NULL,
  location_id TEXT NOT NULL,
  level_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  -- Percentiles
  p10 NUMERIC NOT NULL,
  p25 NUMERIC NOT NULL,
  p50 NUMERIC NOT NULL,
  p75 NUMERIC NOT NULL,
  p90 NUMERIC NOT NULL,
  -- Metadata
  sample_size INTEGER,
  source TEXT DEFAULT 'uploaded' CHECK (source IN ('uploaded', 'market', 'survey')),
  confidence TEXT DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_to DATE,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Composite unique constraint
  UNIQUE(workspace_id, role_id, location_id, level_id, valid_from)
);

-- 8. Data Uploads - Audit trail for all imports
CREATE TABLE IF NOT EXISTS data_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  -- Upload info
  upload_type TEXT NOT NULL CHECK (upload_type IN ('employees', 'benchmarks', 'compensation')),
  file_name TEXT NOT NULL,
  file_size INTEGER,
  -- Results
  row_count INTEGER,
  success_count INTEGER,
  error_count INTEGER,
  errors JSONB,
  -- Metadata
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Compensation History - Track salary changes over time
CREATE TABLE IF NOT EXISTS compensation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  -- Compensation snapshot
  effective_date DATE NOT NULL,
  base_salary NUMERIC NOT NULL,
  bonus NUMERIC,
  equity NUMERIC,
  currency TEXT DEFAULT 'GBP',
  -- Change info
  change_reason TEXT,
  change_percentage NUMERIC,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE compensation_history ENABLE ROW LEVEL SECURITY;

-- Policies for Employees
DROP POLICY IF EXISTS "Users can view their workspace employees" ON employees;
CREATE POLICY "Users can view their workspace employees"
ON employees FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert workspace employees" ON employees;
CREATE POLICY "Users can insert workspace employees"
ON employees FOR INSERT
WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update workspace employees" ON employees;
CREATE POLICY "Users can update workspace employees"
ON employees FOR UPDATE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete workspace employees" ON employees;
CREATE POLICY "Users can delete workspace employees"
ON employees FOR DELETE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- Policies for Salary Benchmarks
DROP POLICY IF EXISTS "Users can view their workspace benchmarks" ON salary_benchmarks;
CREATE POLICY "Users can view their workspace benchmarks"
ON salary_benchmarks FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert workspace benchmarks" ON salary_benchmarks;
CREATE POLICY "Users can insert workspace benchmarks"
ON salary_benchmarks FOR INSERT
WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update workspace benchmarks" ON salary_benchmarks;
CREATE POLICY "Users can update workspace benchmarks"
ON salary_benchmarks FOR UPDATE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete workspace benchmarks" ON salary_benchmarks;
CREATE POLICY "Users can delete workspace benchmarks"
ON salary_benchmarks FOR DELETE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- Policies for Data Uploads
DROP POLICY IF EXISTS "Users can view their workspace uploads" ON data_uploads;
CREATE POLICY "Users can view their workspace uploads"
ON data_uploads FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert workspace uploads" ON data_uploads;
CREATE POLICY "Users can insert workspace uploads"
ON data_uploads FOR INSERT
WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- Policies for Compensation History
DROP POLICY IF EXISTS "Users can view compensation history" ON compensation_history;
CREATE POLICY "Users can view compensation history"
ON compensation_history FOR SELECT
USING (employee_id IN (
  SELECT id FROM employees WHERE workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  )
));

DROP POLICY IF EXISTS "Users can insert compensation history" ON compensation_history;
CREATE POLICY "Users can insert compensation history"
ON compensation_history FOR INSERT
WITH CHECK (employee_id IN (
  SELECT id FROM employees WHERE workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  )
));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_workspace ON employees(workspace_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role_id);
CREATE INDEX IF NOT EXISTS idx_employees_location ON employees(location_id);

CREATE INDEX IF NOT EXISTS idx_salary_benchmarks_workspace ON salary_benchmarks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_salary_benchmarks_lookup ON salary_benchmarks(role_id, location_id, level_id);

CREATE INDEX IF NOT EXISTS idx_data_uploads_workspace ON data_uploads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_compensation_history_employee ON compensation_history(employee_id);

-- ============================================================================
-- INTEGRATIONS TABLES
-- ============================================================================

-- 10. Integrations - Connected third-party services per workspace
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  -- Provider info
  provider TEXT NOT NULL, -- e.g. 'slack', 'teams', 'merge_hris', 'zenhr', 'bayzat'
  category TEXT NOT NULL CHECK (category IN ('notification', 'hris', 'ats')),
  -- Connection state
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'syncing')),
  config JSONB DEFAULT '{}', -- Channel IDs, sync preferences, field mappings
  -- Auth tokens (encrypted at application layer)
  access_token TEXT,
  refresh_token TEXT,
  merge_account_token TEXT, -- For Merge.dev integrations
  -- Sync metadata
  last_sync_at TIMESTAMPTZ,
  sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'manual')),
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- One active integration per provider per workspace
  UNIQUE(workspace_id, provider)
);

-- 11. Integration Sync Logs - Audit trail for data syncs
CREATE TABLE IF NOT EXISTS integration_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE NOT NULL,
  -- Sync details
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'webhook')),
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  -- Results
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  -- Timing
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 12. Notification Rules - Configurable event triggers for connected notification integrations
CREATE TABLE IF NOT EXISTS notification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE NOT NULL,
  -- Rule config
  event_type TEXT NOT NULL, -- e.g. 'sync_complete', 'out_of_band_alert', 'review_cycle_reminder'
  channel TEXT, -- Slack channel ID, Teams channel, etc.
  enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}', -- Thresholds, filters, custom message templates
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- One rule per event type per integration
  UNIQUE(integration_id, event_type)
);

-- 13. API Keys - Customer API keys for the public Qeemly API
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  -- Key info
  name TEXT NOT NULL, -- User-defined label, e.g. 'Production Key'
  key_prefix TEXT NOT NULL, -- First 8 chars for display, e.g. 'qeem_ab12'
  key_hash TEXT NOT NULL, -- Hashed full key (never store plaintext)
  -- Permissions
  scopes JSONB DEFAULT '["employees:read"]', -- e.g. ["employees:read", "employees:write", "benchmarks:read"]
  -- Lifecycle
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- Nullable, null = never expires
  revoked_at TIMESTAMPTZ, -- Nullable, null = active
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. API Request Logs - Usage tracking for API keys
CREATE TABLE IF NOT EXISTS api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  -- Request info
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  -- Timing
  request_at TIMESTAMPTZ DEFAULT now(),
  response_ms INTEGER
);

-- 15. Outgoing Webhooks - Customer-configured webhook endpoints
CREATE TABLE IF NOT EXISTS outgoing_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  -- Webhook config
  url TEXT NOT NULL,
  secret TEXT NOT NULL, -- For HMAC signature verification
  events JSONB DEFAULT '[]', -- Event types to subscribe to
  enabled BOOLEAN DEFAULT true,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 16. Webhook Delivery Logs - Track outgoing webhook deliveries
CREATE TABLE IF NOT EXISTS webhook_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES outgoing_webhooks(id) ON DELETE CASCADE NOT NULL,
  -- Delivery details
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  -- Timing
  attempted_at TIMESTAMPTZ DEFAULT now(),
  duration_ms INTEGER,
  -- Retry tracking
  attempt_number INTEGER DEFAULT 1,
  next_retry_at TIMESTAMPTZ
);

-- 16b. Contact Leads - durable storage for marketing form submissions
CREATE TABLE IF NOT EXISTS contact_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  team_size TEXT,
  interests JSONB DEFAULT '[]',
  message TEXT NOT NULL,
  preferred_contact TEXT DEFAULT 'email',
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on integration tables
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE outgoing_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_leads ENABLE ROW LEVEL SECURITY;

-- Policies for Integrations
DROP POLICY IF EXISTS "Users can view their workspace integrations" ON integrations;
CREATE POLICY "Users can view their workspace integrations"
ON integrations FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage workspace integrations" ON integrations;
CREATE POLICY "Admins can manage workspace integrations"
ON integrations FOR ALL
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for Integration Sync Logs
DROP POLICY IF EXISTS "Users can view their workspace sync logs" ON integration_sync_logs;
CREATE POLICY "Users can view their workspace sync logs"
ON integration_sync_logs FOR SELECT
USING (integration_id IN (
  SELECT id FROM integrations WHERE workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  )
));

-- Policies for Notification Rules
DROP POLICY IF EXISTS "Users can view their workspace notification rules" ON notification_rules;
CREATE POLICY "Users can view their workspace notification rules"
ON notification_rules FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage notification rules" ON notification_rules;
CREATE POLICY "Admins can manage notification rules"
ON notification_rules FOR ALL
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for API Keys
DROP POLICY IF EXISTS "Users can view their workspace API keys" ON api_keys;
CREATE POLICY "Users can view their workspace API keys"
ON api_keys FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage API keys" ON api_keys;
CREATE POLICY "Admins can manage API keys"
ON api_keys FOR ALL
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for API Request Logs
DROP POLICY IF EXISTS "Users can view their workspace API logs" ON api_request_logs;
CREATE POLICY "Users can view their workspace API logs"
ON api_request_logs FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- Policies for Outgoing Webhooks
DROP POLICY IF EXISTS "Users can view their workspace webhooks" ON outgoing_webhooks;
CREATE POLICY "Users can view their workspace webhooks"
ON outgoing_webhooks FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage outgoing webhooks" ON outgoing_webhooks;
CREATE POLICY "Admins can manage outgoing webhooks"
ON outgoing_webhooks FOR ALL
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for Webhook Delivery Logs
DROP POLICY IF EXISTS "Users can view their workspace webhook deliveries" ON webhook_delivery_logs;
CREATE POLICY "Users can view their workspace webhook deliveries"
ON webhook_delivery_logs FOR SELECT
USING (webhook_id IN (
  SELECT id FROM outgoing_webhooks WHERE workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  )
));

-- Indexes for integration tables
CREATE INDEX IF NOT EXISTS idx_integrations_workspace ON integrations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);
CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_integration ON integration_sync_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_started ON integration_sync_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_rules_workspace ON notification_rules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_workspace ON api_keys(workspace_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_key ON api_request_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_workspace ON api_request_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_request_at ON api_request_logs(request_at DESC);
CREATE INDEX IF NOT EXISTS idx_outgoing_webhooks_workspace ON outgoing_webhooks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_webhook ON webhook_delivery_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_attempted ON webhook_delivery_logs(attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_leads_created_at ON contact_leads(created_at DESC);

-- ============================================================================
-- EMPLOYEE SELF-SERVICE: additional FK, policies, and indexes
-- ============================================================================

-- FK from profiles.employee_id -> employees.id (added after employees table exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_id UUID;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS fk_profiles_employee;
ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_employee
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_employee ON profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);

-- Employee-role users can view ONLY their own employee record
DROP POLICY IF EXISTS "Employees can view own record" ON employees;
CREATE POLICY "Employees can view own record"
ON employees FOR SELECT
USING (
  id = (SELECT employee_id FROM profiles WHERE id = auth.uid() AND role = 'employee')
);

-- Employee-role users can view ONLY their own compensation history
DROP POLICY IF EXISTS "Employees can view own compensation history" ON compensation_history;
CREATE POLICY "Employees can view own compensation history"
ON compensation_history FOR SELECT
USING (
  employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid() AND role = 'employee')
);

-- ============================================================================
-- DATA PIPELINE: Source Registry, Raw Storage, Ingestion Jobs
-- ============================================================================

-- 17. ingestion_sources - Registry of approved market data sources
CREATE TABLE IF NOT EXISTS ingestion_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identity
  slug TEXT UNIQUE NOT NULL, -- e.g. 'uk_ons_ashe', 'qeemly_gcc_survey'
  name TEXT NOT NULL,
  description TEXT,
  -- Scope
  category TEXT NOT NULL CHECK (category IN ('market', 'survey', 'partner', 'govt')),
  regions TEXT[] DEFAULT '{}', -- e.g. ['GCC', 'UK', 'AE', 'SA']
  -- Licensing
  license_url TEXT,
  terms_summary TEXT,
  approved_for_commercial BOOLEAN DEFAULT false,
  needs_review BOOLEAN DEFAULT true, -- gate until approved
  -- Update cadence
  update_cadence TEXT DEFAULT 'daily' CHECK (update_cadence IN ('realtime', 'hourly', 'daily', 'weekly', 'manual')),
  -- Field availability (JSON schema of expected fields)
  expected_fields JSONB DEFAULT '[]', -- e.g. ["role", "level", "location", "p50", "currency"]
  -- Config
  enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}', -- fetch URL, auth hints, mapping overrides
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 18. raw_source_snapshots - Raw data before normalization (provenance)
CREATE TABLE IF NOT EXISTS raw_source_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES ingestion_sources(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE, -- null = platform-wide (market data)
  -- Provenance
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  schema_version TEXT NOT NULL DEFAULT 'v1',
  checksum TEXT, -- hash of raw payload for dedup/idempotency
  row_count INTEGER,
  -- Storage: raw JSON rows (or reference to storage bucket path)
  storage_path TEXT, -- optional: Supabase Storage path
  sample_preview JSONB, -- first N rows for debugging
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 19. ingestion_jobs - Job queue (Vercel Cron creates rows)
CREATE TABLE IF NOT EXISTS ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES ingestion_sources(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE, -- null = platform-wide
  -- Status
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'success', 'partial', 'failed')),
  job_type TEXT NOT NULL CHECK (job_type IN ('full', 'incremental', 'webhook')),
  -- Locking / retries
  locked_at TIMESTAMPTZ,
  locked_by TEXT, -- instance/worker ID
  attempt_number INTEGER DEFAULT 1,
  max_attempts INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  -- Results
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  dq_report JSONB, -- data quality report per run
  -- Timing
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 20. data_freshness_metrics - Computed freshness per dataset/view
CREATE TABLE IF NOT EXISTS data_freshness_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE, -- null = platform
  source_id UUID REFERENCES ingestion_sources(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- 'benchmarks', 'employees', 'integration_sync'
  -- Freshness
  last_updated_at TIMESTAMPTZ NOT NULL,
  record_count INTEGER,
  confidence TEXT DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
  -- Computed
  computed_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for pipeline tables
CREATE INDEX IF NOT EXISTS idx_ingestion_sources_slug ON ingestion_sources(slug);
CREATE INDEX IF NOT EXISTS idx_ingestion_sources_enabled ON ingestion_sources(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_raw_source_snapshots_source ON raw_source_snapshots(source_id);
CREATE INDEX IF NOT EXISTS idx_raw_source_snapshots_fetched ON raw_source_snapshots(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status ON ingestion_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_source ON ingestion_jobs(source_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_created ON ingestion_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_freshness_workspace ON data_freshness_metrics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_data_freshness_source ON data_freshness_metrics(source_id);

-- Migration: Add new columns to workspace_settings if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspace_settings' AND column_name = 'company_logo') THEN
    ALTER TABLE workspace_settings ADD COLUMN company_logo TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspace_settings' AND column_name = 'company_website') THEN
    ALTER TABLE workspace_settings ADD COLUMN company_website TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspace_settings' AND column_name = 'company_description') THEN
    ALTER TABLE workspace_settings ADD COLUMN company_description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspace_settings' AND column_name = 'primary_color') THEN
    ALTER TABLE workspace_settings ADD COLUMN primary_color TEXT DEFAULT '#5C45FD';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspace_settings' AND column_name = 'default_bonus_percentage') THEN
    ALTER TABLE workspace_settings ADD COLUMN default_bonus_percentage NUMERIC DEFAULT 15;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspace_settings' AND column_name = 'equity_vesting_schedule') THEN
    ALTER TABLE workspace_settings ADD COLUMN equity_vesting_schedule TEXT DEFAULT '4-year-1-cliff';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspace_settings' AND column_name = 'benefits_tier') THEN
    ALTER TABLE workspace_settings ADD COLUMN benefits_tier TEXT DEFAULT 'standard';
  END IF;
END $$;

-- Migration: Add compensation split columns to workspace_settings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspace_settings' AND column_name = 'comp_split_basic_pct') THEN
    ALTER TABLE workspace_settings ADD COLUMN comp_split_basic_pct NUMERIC DEFAULT 60;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspace_settings' AND column_name = 'comp_split_housing_pct') THEN
    ALTER TABLE workspace_settings ADD COLUMN comp_split_housing_pct NUMERIC DEFAULT 25;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspace_settings' AND column_name = 'comp_split_transport_pct') THEN
    ALTER TABLE workspace_settings ADD COLUMN comp_split_transport_pct NUMERIC DEFAULT 10;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspace_settings' AND column_name = 'comp_split_other_pct') THEN
    ALTER TABLE workspace_settings ADD COLUMN comp_split_other_pct NUMERIC DEFAULT 5;
  END IF;
END $$;

-- Migration: Add national cost component columns to salary_benchmarks
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salary_benchmarks' AND column_name = 'national_gpssa_pct') THEN
    ALTER TABLE salary_benchmarks ADD COLUMN national_gpssa_pct NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salary_benchmarks' AND column_name = 'national_nafis_pct') THEN
    ALTER TABLE salary_benchmarks ADD COLUMN national_nafis_pct NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salary_benchmarks' AND column_name = 'national_total_cost_multiplier') THEN
    ALTER TABLE salary_benchmarks ADD COLUMN national_total_cost_multiplier NUMERIC DEFAULT 1.0;
  END IF;
END $$;

-- ============================================================================
-- ROLE DESCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS role_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL,
  level_id TEXT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  responsibilities TEXT[],
  requirements TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, role_id, level_id)
);

ALTER TABLE role_descriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their workspace role descriptions" ON role_descriptions;
CREATE POLICY "Users can view their workspace role descriptions"
ON role_descriptions FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert workspace role descriptions" ON role_descriptions;
CREATE POLICY "Users can insert workspace role descriptions"
ON role_descriptions FOR INSERT
WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update workspace role descriptions" ON role_descriptions;
CREATE POLICY "Users can update workspace role descriptions"
ON role_descriptions FOR UPDATE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete workspace role descriptions" ON role_descriptions;
CREATE POLICY "Users can delete workspace role descriptions"
ON role_descriptions FOR DELETE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_role_descriptions_workspace ON role_descriptions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_role_descriptions_role ON role_descriptions(role_id);

-- ============================================================================
-- REPORTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type_id TEXT NOT NULL CHECK (type_id IN ('overview', 'benchmark', 'compliance', 'custom')),
  status TEXT DEFAULT 'Building' CHECK (status IN ('Scheduled', 'Ready', 'In Review', 'Building')),
  owner TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  -- Schedule
  schedule_cadence TEXT CHECK (schedule_cadence IN ('once', 'daily', 'weekly', 'monthly', 'quarterly')),
  schedule_next_run TIMESTAMPTZ,
  -- Recipients
  recipients TEXT[] DEFAULT '{}',
  -- Content
  config JSONB DEFAULT '{}',
  result_data JSONB,
  format TEXT DEFAULT 'PDF' CHECK (format IN ('PDF', 'XLSX', 'Slides')),
  -- Timestamps
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their workspace reports" ON reports;
CREATE POLICY "Users can view their workspace reports"
ON reports FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert workspace reports" ON reports;
CREATE POLICY "Users can insert workspace reports"
ON reports FOR INSERT
WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update workspace reports" ON reports;
CREATE POLICY "Users can update workspace reports"
ON reports FOR UPDATE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete workspace reports" ON reports;
CREATE POLICY "Users can delete workspace reports"
ON reports FOR DELETE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_reports_workspace ON reports(workspace_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS template_id UUID,
  ADD COLUMN IF NOT EXISTS template_version INTEGER,
  ADD COLUMN IF NOT EXISTS last_run_id UUID,
  ADD COLUMN IF NOT EXISTS build_error TEXT;

-- ============================================================================
-- REPORT TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  type_id TEXT NOT NULL CHECK (type_id IN ('overview', 'benchmark', 'compliance', 'custom')),
  category TEXT DEFAULT 'all',
  description TEXT DEFAULT '',
  cadence TEXT DEFAULT 'On Demand',
  coverage TEXT DEFAULT 'All roles',
  confidence TEXT DEFAULT 'Medium' CHECK (confidence IN ('High', 'Medium', 'Low')),
  owner TEXT DEFAULT 'People Analytics',
  tags TEXT[] DEFAULT '{}',
  config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view workspace and global report templates" ON report_templates;
CREATE POLICY "Users can view workspace and global report templates"
ON report_templates FOR SELECT
USING (
  workspace_id IS NULL
  OR workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert workspace report templates" ON report_templates;
CREATE POLICY "Users can insert workspace report templates"
ON report_templates FOR INSERT
WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update workspace report templates" ON report_templates;
CREATE POLICY "Users can update workspace report templates"
ON report_templates FOR UPDATE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete workspace report templates" ON report_templates;
CREATE POLICY "Users can delete workspace report templates"
ON report_templates FOR DELETE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE UNIQUE INDEX IF NOT EXISTS idx_report_templates_global_slug_version
  ON report_templates(slug, version)
  WHERE workspace_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_report_templates_workspace_slug_version
  ON report_templates(workspace_id, slug, version)
  WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_report_templates_workspace_active
  ON report_templates(workspace_id, is_active, type_id);

-- ============================================================================
-- REPORT RUNS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS report_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'success', 'failed')),
  triggered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  trigger_source TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_source IN ('manual', 'schedule', 'api', 'template')),
  attempt_number INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  result_data JSONB,
  artifact_url TEXT,
  artifact_format TEXT CHECK (artifact_format IN ('PDF', 'XLSX', 'Slides')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE report_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view workspace report runs" ON report_runs;
CREATE POLICY "Users can view workspace report runs"
ON report_runs FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert workspace report runs" ON report_runs;
CREATE POLICY "Users can insert workspace report runs"
ON report_runs FOR INSERT
WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update workspace report runs" ON report_runs;
CREATE POLICY "Users can update workspace report runs"
ON report_runs FOR UPDATE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete workspace report runs" ON report_runs;
CREATE POLICY "Users can delete workspace report runs"
ON report_runs FOR DELETE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_report_runs_report_created
  ON report_runs(report_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_runs_workspace_status
  ON report_runs(workspace_id, status, created_at DESC);

ALTER TABLE reports
  DROP CONSTRAINT IF EXISTS reports_template_id_fkey,
  ADD CONSTRAINT reports_template_id_fkey
  FOREIGN KEY (template_id) REFERENCES report_templates(id) ON DELETE SET NULL;

ALTER TABLE reports
  DROP CONSTRAINT IF EXISTS reports_last_run_id_fkey,
  ADD CONSTRAINT reports_last_run_id_fkey
  FOREIGN KEY (last_run_id) REFERENCES report_runs(id) ON DELETE SET NULL;

-- ============================================================================
-- OFFERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_name TEXT,
  recipient_email TEXT,
  role_id TEXT NOT NULL,
  level_id TEXT NOT NULL,
  location_id TEXT NOT NULL,
  employment_type TEXT NOT NULL CHECK (employment_type IN ('national', 'expat')),
  target_percentile INTEGER NOT NULL CHECK (target_percentile >= 0 AND target_percentile <= 100),
  offer_value NUMERIC NOT NULL CHECK (offer_value >= 0),
  offer_low NUMERIC NOT NULL CHECK (offer_low >= 0),
  offer_high NUMERIC NOT NULL CHECK (offer_high >= 0),
  currency TEXT NOT NULL,
  salary_breakdown JSONB DEFAULT '{}'::jsonb NOT NULL,
  benchmark_snapshot JSONB DEFAULT '{}'::jsonb NOT NULL,
  export_format TEXT DEFAULT 'PDF' CHECK (export_format IN ('PDF', 'DOCX', 'JSON')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'sent', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT offers_recipient_mode_check CHECK (
    (employee_id IS NOT NULL AND recipient_name IS NULL AND recipient_email IS NULL)
    OR
    (employee_id IS NULL AND recipient_name IS NOT NULL AND recipient_email IS NOT NULL)
  )
);

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their workspace offers" ON offers;
CREATE POLICY "Users can view their workspace offers"
ON offers FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert workspace offers" ON offers;
CREATE POLICY "Users can insert workspace offers"
ON offers FOR INSERT
WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update workspace offers" ON offers;
CREATE POLICY "Users can update workspace offers"
ON offers FOR UPDATE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete workspace offers" ON offers;
CREATE POLICY "Users can delete workspace offers"
ON offers FOR DELETE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_offers_workspace ON offers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_offers_employee ON offers(employee_id);
CREATE INDEX IF NOT EXISTS idx_offers_created_at_desc ON offers(created_at DESC);
