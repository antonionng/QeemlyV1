-- Add change_reason and band upgrade recommendation columns to salary_review_proposal_items
ALTER TABLE salary_review_proposal_items
  ADD COLUMN IF NOT EXISTS change_reason TEXT,
  ADD COLUMN IF NOT EXISTS recommended_level_id TEXT,
  ADD COLUMN IF NOT EXISTS recommended_level_name TEXT;
