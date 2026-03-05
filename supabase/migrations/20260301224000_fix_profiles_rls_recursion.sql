-- Fix recursive RLS evaluation on profiles.
-- The old profiles SELECT policies queried profiles again, which caused:
-- "infinite recursion detected in policy for relation 'profiles'".

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

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all profiles in workspace" ON public.profiles;
CREATE POLICY "Admins can view all profiles in workspace"
ON public.profiles FOR SELECT
USING (
  public.current_user_role() = 'admin'
  AND workspace_id = public.current_workspace_id()
);

DROP POLICY IF EXISTS "Members can view profiles in same workspace" ON public.profiles;
CREATE POLICY "Members can view profiles in same workspace"
ON public.profiles FOR SELECT
USING (workspace_id = public.current_workspace_id());
