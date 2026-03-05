-- Persistent AI chat threads and messages (general + employee context)

CREATE TABLE IF NOT EXISTS public.ai_chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('general', 'employee')),
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  employee_name TEXT,
  employee_role TEXT,
  employee_department TEXT,
  title TEXT NOT NULL DEFAULT 'New chat',
  auto_titled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  CONSTRAINT ai_chat_threads_employee_mode_check CHECK (
    (mode = 'general' AND employee_id IS NULL)
    OR
    (mode = 'employee' AND employee_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.ai_chat_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  confidence INTEGER CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 100)),
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own AI chat threads" ON public.ai_chat_threads;
CREATE POLICY "Users can view their own AI chat threads"
ON public.ai_chat_threads FOR SELECT
USING (
  user_id = auth.uid()
  AND workspace_id = public.current_workspace_id()
);

DROP POLICY IF EXISTS "Users can insert their own AI chat threads" ON public.ai_chat_threads;
CREATE POLICY "Users can insert their own AI chat threads"
ON public.ai_chat_threads FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND workspace_id = public.current_workspace_id()
);

DROP POLICY IF EXISTS "Users can update their own AI chat threads" ON public.ai_chat_threads;
CREATE POLICY "Users can update their own AI chat threads"
ON public.ai_chat_threads FOR UPDATE
USING (
  user_id = auth.uid()
  AND workspace_id = public.current_workspace_id()
)
WITH CHECK (
  user_id = auth.uid()
  AND workspace_id = public.current_workspace_id()
);

DROP POLICY IF EXISTS "Users can delete their own AI chat threads" ON public.ai_chat_threads;
CREATE POLICY "Users can delete their own AI chat threads"
ON public.ai_chat_threads FOR DELETE
USING (
  user_id = auth.uid()
  AND workspace_id = public.current_workspace_id()
);

DROP POLICY IF EXISTS "Users can view AI chat messages for their threads" ON public.ai_chat_messages;
CREATE POLICY "Users can view AI chat messages for their threads"
ON public.ai_chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.ai_chat_threads t
    WHERE t.id = ai_chat_messages.thread_id
      AND t.user_id = auth.uid()
      AND t.workspace_id = public.current_workspace_id()
      AND t.archived_at IS NULL
  )
);

DROP POLICY IF EXISTS "Users can insert AI chat messages for their threads" ON public.ai_chat_messages;
CREATE POLICY "Users can insert AI chat messages for their threads"
ON public.ai_chat_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.ai_chat_threads t
    WHERE t.id = ai_chat_messages.thread_id
      AND t.user_id = auth.uid()
      AND t.workspace_id = public.current_workspace_id()
      AND t.archived_at IS NULL
  )
);

DROP POLICY IF EXISTS "Users can delete AI chat messages for their threads" ON public.ai_chat_messages;
CREATE POLICY "Users can delete AI chat messages for their threads"
ON public.ai_chat_messages FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.ai_chat_threads t
    WHERE t.id = ai_chat_messages.thread_id
      AND t.user_id = auth.uid()
      AND t.workspace_id = public.current_workspace_id()
  )
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_threads_workspace_user_last_message
  ON public.ai_chat_threads(workspace_id, user_id, last_message_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ai_chat_threads_workspace_user_updated
  ON public.ai_chat_threads(workspace_id, user_id, updated_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ai_chat_threads_employee_id
  ON public.ai_chat_threads(employee_id);

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_thread_created
  ON public.ai_chat_messages(thread_id, created_at ASC);
