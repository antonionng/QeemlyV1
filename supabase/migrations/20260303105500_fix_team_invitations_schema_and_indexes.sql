-- Ensure team invitation schema supports role-based invites.
-- This migration is safe to run on existing environments with partial schema.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES public.profiles(id),
  role TEXT DEFAULT 'member',
  token TEXT UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.team_invitations
  ADD COLUMN IF NOT EXISTS role TEXT;

ALTER TABLE public.team_invitations
  ADD COLUMN IF NOT EXISTS token TEXT;

ALTER TABLE public.team_invitations
  ADD COLUMN IF NOT EXISTS status TEXT;

ALTER TABLE public.team_invitations
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

UPDATE public.team_invitations
SET role = 'member'
WHERE role IS NULL;

UPDATE public.team_invitations
SET status = 'pending'
WHERE status IS NULL;

UPDATE public.team_invitations
SET token = replace(gen_random_uuid()::text, '-', '')
WHERE token IS NULL;

ALTER TABLE public.team_invitations
  ALTER COLUMN role SET DEFAULT 'member';

ALTER TABLE public.team_invitations
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.team_invitations
  ALTER COLUMN token SET DEFAULT replace(gen_random_uuid()::text, '-', '');

ALTER TABLE public.team_invitations
  ALTER COLUMN created_at SET DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS idx_team_invitations_token
  ON public.team_invitations(token);

CREATE INDEX IF NOT EXISTS idx_team_invitations_workspace_status
  ON public.team_invitations(workspace_id, status);

CREATE INDEX IF NOT EXISTS idx_team_invitations_workspace_email_pending
  ON public.team_invitations(workspace_id, email)
  WHERE status = 'pending';
