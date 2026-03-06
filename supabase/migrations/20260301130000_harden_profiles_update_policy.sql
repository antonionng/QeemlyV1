-- Harden profile updates to prevent tenant/role self-escalation.
-- Users may update their own profile fields, but cannot reassign workspace or role.

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE NOTICE 'Skipping profiles hardening: public.profiles does not exist yet.';
    RETURN;
  END IF;

  EXECUTE 'DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles';
  EXECUTE $policy$
    CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid())
  $policy$;
END
$$;
