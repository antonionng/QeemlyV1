-- Track workspace onboarding progress on workspace_settings (timestamps per step).
ALTER TABLE public.workspace_settings
  ADD COLUMN IF NOT EXISTS onboarding_company_profile_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_compensation_defaults_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_upload_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_upload_skipped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_first_benchmark_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMPTZ;

-- Document allowed invitation roles (column already exists; company_admin is supported in app code).
COMMENT ON COLUMN public.team_invitations.role IS 'Allowed values: admin, member, employee, company_admin';
