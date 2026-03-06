-- Ensure newer workspace_settings compensation defaults exist across environments.
DO $$
BEGIN
  IF to_regclass('public.workspace_settings') IS NULL THEN
    RAISE NOTICE 'Skipping workspace_settings column patch: table does not exist.';
    RETURN;
  END IF;

  ALTER TABLE public.workspace_settings
    ADD COLUMN IF NOT EXISTS benefits_tier TEXT DEFAULT 'standard',
    ADD COLUMN IF NOT EXISTS comp_split_basic_pct NUMERIC DEFAULT 60,
    ADD COLUMN IF NOT EXISTS comp_split_housing_pct NUMERIC DEFAULT 25,
    ADD COLUMN IF NOT EXISTS comp_split_transport_pct NUMERIC DEFAULT 10,
    ADD COLUMN IF NOT EXISTS comp_split_other_pct NUMERIC DEFAULT 5;
END $$;
