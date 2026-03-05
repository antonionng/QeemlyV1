-- Harden profile updates to prevent tenant/role self-escalation.
-- Users may update their own profile fields, but cannot reassign workspace or role.

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND workspace_id = public.current_workspace_id()
  AND role = public.current_user_role()
);
