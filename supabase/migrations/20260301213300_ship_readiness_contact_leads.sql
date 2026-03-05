-- Ship readiness: durable contact lead persistence
CREATE TABLE IF NOT EXISTS contact_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  team_size TEXT,
  interests JSONB DEFAULT '[]',
  message TEXT NOT NULL,
  preferred_contact TEXT DEFAULT 'email',
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contact_leads ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_contact_leads_created_at
  ON contact_leads(created_at DESC);
