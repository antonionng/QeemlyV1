-- Fix recursive RLS evaluation on profiles.
-- The old profiles SELECT policies queried profiles again, which caused:
-- "infinite recursion detected in policy for relation 'profiles'".

CREATE OR REPLACE FUNCTION public.current_workspace_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ws_id uuid;
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RETURN NULL;
  END IF;

  EXECUTE
    'SELECT workspace_id FROM public.profiles WHERE id = auth.uid() LIMIT 1'
  INTO ws_id;

  RETURN ws_id;
END
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_value text;
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RETURN NULL;
  END IF;

  EXECUTE
    'SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1'
  INTO role_value;

  RETURN role_value;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE NOTICE 'Skipping profile policy refresh: public.profiles does not exist yet.';
    RETURN;
  END IF;

  EXECUTE 'DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles';
  EXECUTE $policy$
    CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid())
  $policy$;

  EXECUTE 'DROP POLICY IF EXISTS "Admins can view all profiles in workspace" ON public.profiles';
  EXECUTE $policy$
    CREATE POLICY "Admins can view all profiles in workspace"
    ON public.profiles FOR SELECT
    USING (
      public.current_user_role() = 'admin'
      AND workspace_id = public.current_workspace_id()
    )
  $policy$;

  EXECUTE 'DROP POLICY IF EXISTS "Members can view profiles in same workspace" ON public.profiles';
  EXECUTE $policy$
    CREATE POLICY "Members can view profiles in same workspace"
    ON public.profiles FOR SELECT
    USING (workspace_id = public.current_workspace_id())
  $policy$;
END
$$;
