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
  role TEXT DEFAULT 'member', -- 'admin' or 'member'
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Team Invitations
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES profiles(id),
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

-- Policies for Workspaces
CREATE POLICY "Users can view their own workspace" 
ON workspaces FOR SELECT 
USING (id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- Policies for Profiles
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles in workspace" 
ON profiles FOR SELECT 
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for Invitations
CREATE POLICY "Admins can manage invitations" 
ON team_invitations FOR ALL 
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for Datasets
CREATE POLICY "Users can manage their workspace datasets" 
ON user_datasets FOR ALL 
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- Policies for Workspace Settings
CREATE POLICY "Users can view their workspace settings" 
ON workspace_settings FOR SELECT 
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage workspace settings" 
ON workspace_settings FOR ALL 
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- INSERT Policies (needed for signup flow)
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (id = auth.uid());

CREATE POLICY "Authenticated users can create workspaces"
ON workspaces FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- STORAGE BUCKETS
-- Run this manually in Supabase Storage UI or via SQL if supported by your version
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('datasets', 'datasets', false);

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
CREATE POLICY "Users can view their workspace employees"
ON employees FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert workspace employees"
ON employees FOR INSERT
WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update workspace employees"
ON employees FOR UPDATE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete workspace employees"
ON employees FOR DELETE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- Policies for Salary Benchmarks
CREATE POLICY "Users can view their workspace benchmarks"
ON salary_benchmarks FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert workspace benchmarks"
ON salary_benchmarks FOR INSERT
WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update workspace benchmarks"
ON salary_benchmarks FOR UPDATE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete workspace benchmarks"
ON salary_benchmarks FOR DELETE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- Policies for Data Uploads
CREATE POLICY "Users can view their workspace uploads"
ON data_uploads FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert workspace uploads"
ON data_uploads FOR INSERT
WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- Policies for Compensation History
CREATE POLICY "Users can view compensation history"
ON compensation_history FOR SELECT
USING (employee_id IN (
  SELECT id FROM employees WHERE workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  )
));

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

-- Enable RLS on integration tables
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE outgoing_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Policies for Integrations
CREATE POLICY "Users can view their workspace integrations"
ON integrations FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage workspace integrations"
ON integrations FOR ALL
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for Integration Sync Logs
CREATE POLICY "Users can view their workspace sync logs"
ON integration_sync_logs FOR SELECT
USING (integration_id IN (
  SELECT id FROM integrations WHERE workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  )
));

-- Policies for Notification Rules
CREATE POLICY "Users can view their workspace notification rules"
ON notification_rules FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage notification rules"
ON notification_rules FOR ALL
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for API Keys
CREATE POLICY "Users can view their workspace API keys"
ON api_keys FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage API keys"
ON api_keys FOR ALL
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for API Request Logs
CREATE POLICY "Users can view their workspace API logs"
ON api_request_logs FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- Policies for Outgoing Webhooks
CREATE POLICY "Users can view their workspace webhooks"
ON outgoing_webhooks FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage outgoing webhooks"
ON outgoing_webhooks FOR ALL
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for Webhook Delivery Logs
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
