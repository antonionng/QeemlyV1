-- Backfill legacy workspace_settings profile/branding columns when environments
-- were created before the latest schema.
DO $$
BEGIN
  IF to_regclass('public.workspace_settings') IS NULL THEN
    RAISE NOTICE 'Skipping workspace_settings profile column patch: table does not exist.';
    RETURN;
  END IF;

  ALTER TABLE public.workspace_settings
    ADD COLUMN IF NOT EXISTS company_name TEXT,
    ADD COLUMN IF NOT EXISTS company_logo TEXT,
    ADD COLUMN IF NOT EXISTS company_website TEXT,
    ADD COLUMN IF NOT EXISTS company_description TEXT,
    ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#5C45FD',
    ADD COLUMN IF NOT EXISTS industry TEXT,
    ADD COLUMN IF NOT EXISTS company_size TEXT,
    ADD COLUMN IF NOT EXISTS funding_stage TEXT,
    ADD COLUMN IF NOT EXISTS headquarters_country TEXT,
    ADD COLUMN IF NOT EXISTS headquarters_city TEXT,
    ADD COLUMN IF NOT EXISTS target_percentile INTEGER DEFAULT 50,
    ADD COLUMN IF NOT EXISTS review_cycle TEXT DEFAULT 'annual',
    ADD COLUMN IF NOT EXISTS default_currency TEXT DEFAULT 'AED',
    ADD COLUMN IF NOT EXISTS fiscal_year_start INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS is_configured BOOLEAN DEFAULT false;
END $$;
