ALTER TABLE ingestion_sources
  ADD COLUMN IF NOT EXISTS tier TEXT CHECK (tier IN ('official', 'proxy'));

UPDATE ingestion_sources
SET tier = CASE
  WHEN slug IN (
    'kapsarc_saudi',
    'qatar_wages',
    'bahrain_compensation',
    'uae_fcsc_workforce_comp',
    'uae_fcsc_public_admin_paid',
    'uae_fcsc_gov_compensation',
    'oman_ncsi_wages',
    'oman_labour_private',
    'oman_labour_public',
    'qatar_labor_force_sector',
    'qatar_inactive_population',
    'bahrain_lmra_work_permits',
    'bahrain_labor_market',
    'kuwait_open_labor',
    'saudi_gastat_labor',
    'jordan_dos_labor'
  ) THEN 'official'
  ELSE 'proxy'
END
WHERE tier IS NULL;
