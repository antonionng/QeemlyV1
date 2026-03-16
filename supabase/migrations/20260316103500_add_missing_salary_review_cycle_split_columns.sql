ALTER TABLE salary_review_cycles
  ADD COLUMN IF NOT EXISTS review_mode TEXT NOT NULL DEFAULT 'company_wide'
    CHECK (review_mode IN ('company_wide', 'department_split')),
  ADD COLUMN IF NOT EXISTS review_scope TEXT NOT NULL DEFAULT 'company_wide'
    CHECK (review_scope IN ('company_wide', 'master', 'department')),
  ADD COLUMN IF NOT EXISTS parent_cycle_id UUID REFERENCES salary_review_cycles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS allocation_method TEXT
    CHECK (allocation_method IN ('direct', 'finance_approval')),
  ADD COLUMN IF NOT EXISTS allocation_status TEXT
    CHECK (allocation_status IN ('pending', 'approved', 'returned'));

CREATE INDEX IF NOT EXISTS idx_salary_review_cycles_parent_cycle
  ON salary_review_cycles(parent_cycle_id, department);
