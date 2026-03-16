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

ALTER TABLE salary_review_department_allocations ENABLE ROW LEVEL SECURITY;

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

CREATE INDEX IF NOT EXISTS idx_salary_review_department_allocations_master_cycle
  ON salary_review_department_allocations(master_cycle_id, department);
