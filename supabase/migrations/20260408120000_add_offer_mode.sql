-- Add offer_mode column to distinguish candidate_manual, candidate_advised, internal
ALTER TABLE offers
  ADD COLUMN IF NOT EXISTS offer_mode TEXT NOT NULL DEFAULT 'candidate_advised'
    CHECK (offer_mode IN ('candidate_manual', 'candidate_advised', 'internal'));

-- Internal offers carry structured rationale, guardrails, and notes in JSONB
ALTER TABLE offers
  ADD COLUMN IF NOT EXISTS internal_metadata JSONB DEFAULT '{}'::jsonb NOT NULL;

-- For candidate_advised: preserve the original Qeemly recommendation alongside any user edits
ALTER TABLE offers
  ADD COLUMN IF NOT EXISTS advised_baseline JSONB DEFAULT NULL;

-- Relax recipient constraint: internal offers may omit recipient details
ALTER TABLE offers DROP CONSTRAINT IF EXISTS offers_recipient_mode_check;

ALTER TABLE offers ADD CONSTRAINT offers_recipient_mode_check CHECK (
  offer_mode = 'internal'
  OR (employee_id IS NOT NULL AND recipient_name IS NULL AND recipient_email IS NULL)
  OR (employee_id IS NULL AND recipient_name IS NOT NULL AND recipient_email IS NOT NULL)
);

-- Index on offer_mode for filtered queries
CREATE INDEX IF NOT EXISTS idx_offers_mode ON offers(offer_mode);
