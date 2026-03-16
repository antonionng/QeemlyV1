CREATE TABLE IF NOT EXISTS salary_review_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai')),
  review_mode TEXT NOT NULL DEFAULT 'company_wide' CHECK (review_mode IN ('company_wide', 'department_split')),
  review_scope TEXT NOT NULL DEFAULT 'company_wide' CHECK (review_scope IN ('company_wide', 'master', 'department')),
  parent_cycle_id UUID REFERENCES salary_review_cycles(id) ON DELETE CASCADE,
  department TEXT,
  allocation_method TEXT CHECK (allocation_method IN ('direct', 'finance_approval')),
  allocation_status TEXT CHECK (allocation_status IN ('pending', 'approved', 'returned')),
  cycle TEXT NOT NULL CHECK (cycle IN ('monthly', 'annual')),
  budget_type TEXT NOT NULL CHECK (budget_type IN ('percentage', 'absolute')),
  budget_percentage NUMERIC NOT NULL DEFAULT 0,
  budget_absolute NUMERIC NOT NULL DEFAULT 0,
  effective_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'applied')),
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS salary_review_department_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_cycle_id UUID NOT NULL REFERENCES salary_review_cycles(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  allocated_budget NUMERIC NOT NULL DEFAULT 0,
  allocation_method TEXT NOT NULL CHECK (allocation_method IN ('direct', 'finance_approval')),
  allocation_status TEXT NOT NULL DEFAULT 'pending' CHECK (allocation_status IN ('pending', 'approved', 'returned')),
  child_cycle_id UUID REFERENCES salary_review_cycles(id) ON DELETE SET NULL,
  selected_employee_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS salary_review_proposal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES salary_review_cycles(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  employee_name TEXT NOT NULL,
  selected BOOLEAN NOT NULL DEFAULT true,
  current_salary NUMERIC NOT NULL DEFAULT 0,
  proposed_increase NUMERIC NOT NULL DEFAULT 0,
  proposed_salary NUMERIC NOT NULL DEFAULT 0,
  proposed_percentage NUMERIC NOT NULL DEFAULT 0,
  reason_summary TEXT,
  benchmark_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS salary_review_approval_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES salary_review_cycles(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_key TEXT NOT NULL CHECK (step_key IN ('manager', 'director', 'hr', 'exec')),
  step_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'returned')),
  trigger_reason TEXT,
  actor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  acted_at TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS salary_review_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES salary_review_cycles(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  step_id UUID REFERENCES salary_review_approval_steps(id) ON DELETE SET NULL,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS salary_review_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES salary_review_cycles(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE salary_review_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_review_department_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_review_proposal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_review_approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_review_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_review_audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view workspace salary review cycles" ON salary_review_cycles;
CREATE POLICY "Users can view workspace salary review cycles"
ON salary_review_cycles FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert workspace salary review cycles" ON salary_review_cycles;
CREATE POLICY "Users can insert workspace salary review cycles"
ON salary_review_cycles FOR INSERT
WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update workspace salary review cycles" ON salary_review_cycles;
CREATE POLICY "Users can update workspace salary review cycles"
ON salary_review_cycles FOR UPDATE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete workspace salary review cycles" ON salary_review_cycles;
CREATE POLICY "Users can delete workspace salary review cycles"
ON salary_review_cycles FOR DELETE
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can view workspace salary review items" ON salary_review_proposal_items;
CREATE POLICY "Users can view workspace salary review items"
ON salary_review_proposal_items FOR SELECT
USING (
  cycle_id IN (
    SELECT id FROM salary_review_cycles
    WHERE workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can view workspace salary review department allocations" ON salary_review_department_allocations;
CREATE POLICY "Users can view workspace salary review department allocations"
ON salary_review_department_allocations FOR SELECT
USING (
  master_cycle_id IN (
    SELECT id FROM salary_review_cycles
    WHERE workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can insert workspace salary review department allocations" ON salary_review_department_allocations;
CREATE POLICY "Users can insert workspace salary review department allocations"
ON salary_review_department_allocations FOR INSERT
WITH CHECK (
  master_cycle_id IN (
    SELECT id FROM salary_review_cycles
    WHERE workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can update workspace salary review department allocations" ON salary_review_department_allocations;
CREATE POLICY "Users can update workspace salary review department allocations"
ON salary_review_department_allocations FOR UPDATE
USING (
  master_cycle_id IN (
    SELECT id FROM salary_review_cycles
    WHERE workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can insert workspace salary review items" ON salary_review_proposal_items;
CREATE POLICY "Users can insert workspace salary review items"
ON salary_review_proposal_items FOR INSERT
WITH CHECK (
  cycle_id IN (
    SELECT id FROM salary_review_cycles
    WHERE workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can update workspace salary review items" ON salary_review_proposal_items;
CREATE POLICY "Users can update workspace salary review items"
ON salary_review_proposal_items FOR UPDATE
USING (
  cycle_id IN (
    SELECT id FROM salary_review_cycles
    WHERE workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can view workspace salary review approval steps" ON salary_review_approval_steps;
CREATE POLICY "Users can view workspace salary review approval steps"
ON salary_review_approval_steps FOR SELECT
USING (
  cycle_id IN (
    SELECT id FROM salary_review_cycles
    WHERE workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can insert workspace salary review approval steps" ON salary_review_approval_steps;
CREATE POLICY "Users can insert workspace salary review approval steps"
ON salary_review_approval_steps FOR INSERT
WITH CHECK (
  cycle_id IN (
    SELECT id FROM salary_review_cycles
    WHERE workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can update workspace salary review approval steps" ON salary_review_approval_steps;
CREATE POLICY "Users can update workspace salary review approval steps"
ON salary_review_approval_steps FOR UPDATE
USING (
  cycle_id IN (
    SELECT id FROM salary_review_cycles
    WHERE workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can view workspace salary review notes" ON salary_review_notes;
CREATE POLICY "Users can view workspace salary review notes"
ON salary_review_notes FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert workspace salary review notes" ON salary_review_notes;
CREATE POLICY "Users can insert workspace salary review notes"
ON salary_review_notes FOR INSERT
WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can view workspace salary review audit events" ON salary_review_audit_events;
CREATE POLICY "Users can view workspace salary review audit events"
ON salary_review_audit_events FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert workspace salary review audit events" ON salary_review_audit_events;
CREATE POLICY "Users can insert workspace salary review audit events"
ON salary_review_audit_events FOR INSERT
WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_salary_review_cycles_workspace_updated
  ON salary_review_cycles(workspace_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_salary_review_cycles_parent_cycle
  ON salary_review_cycles(parent_cycle_id, department);
CREATE INDEX IF NOT EXISTS idx_salary_review_department_allocations_master_cycle
  ON salary_review_department_allocations(master_cycle_id, department);
CREATE INDEX IF NOT EXISTS idx_salary_review_items_cycle
  ON salary_review_proposal_items(cycle_id);
CREATE INDEX IF NOT EXISTS idx_salary_review_steps_cycle_order
  ON salary_review_approval_steps(cycle_id, step_order);
CREATE INDEX IF NOT EXISTS idx_salary_review_notes_cycle
  ON salary_review_notes(cycle_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_salary_review_audit_cycle
  ON salary_review_audit_events(cycle_id, created_at DESC);
