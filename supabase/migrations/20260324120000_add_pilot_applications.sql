CREATE TABLE IF NOT EXISTS pilot_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  job_role TEXT NOT NULL,
  company TEXT NOT NULL,
  company_size TEXT NOT NULL,
  industry TEXT NOT NULL,
  work_email TEXT NOT NULL,
  phone_or_whatsapp TEXT,
  source_cta TEXT,
  source_path TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pilot_applications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_pilot_applications_created_at
  ON pilot_applications(created_at DESC);
