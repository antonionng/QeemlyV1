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
  employment_type TEXT DEFAULT 'local' CHECK (employment_type IN ('local', 'expat')),
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
