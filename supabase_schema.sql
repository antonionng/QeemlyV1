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

-- Enable RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_datasets ENABLE ROW LEVEL SECURITY;

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
