CREATE TABLE IF NOT EXISTS public.admin_market_research_pdf_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid NOT NULL REFERENCES public.admin_market_research_uploads(id) ON DELETE CASCADE,
  row_index integer NOT NULL CHECK (row_index > 0),
  source_family text NOT NULL,
  raw_text text NOT NULL,
  role_title text NOT NULL,
  function_name text,
  employment_type text,
  pay_period text NOT NULL CHECK (pay_period IN ('monthly', 'annual')),
  currency text NOT NULL,
  location_hint text NOT NULL,
  level_hint text NOT NULL,
  salary_2025_min numeric NOT NULL,
  salary_2025_max numeric NOT NULL,
  salary_2026_min numeric NOT NULL,
  salary_2026_max numeric NOT NULL,
  parse_confidence text NOT NULL DEFAULT 'medium' CHECK (parse_confidence IN ('high', 'medium', 'low')),
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'ingested')),
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (upload_id, row_index)
);

CREATE INDEX IF NOT EXISTS admin_market_research_pdf_rows_upload_id_idx
  ON public.admin_market_research_pdf_rows (upload_id, row_index);

ALTER TABLE public.admin_market_research_pdf_rows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmins manage admin PDF review rows" ON public.admin_market_research_pdf_rows;
CREATE POLICY "Superadmins manage admin PDF review rows"
ON public.admin_market_research_pdf_rows
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
