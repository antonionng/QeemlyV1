ALTER TABLE public.admin_market_research_uploads
  DROP CONSTRAINT IF EXISTS admin_market_research_uploads_ingestion_status_check;

ALTER TABLE public.admin_market_research_uploads
  ADD CONSTRAINT admin_market_research_uploads_ingestion_status_check
  CHECK (ingestion_status IN ('uploaded', 'ingested', 'reviewing', 'published', 'failed'));

ALTER TABLE public.admin_market_research_pdf_rows
  DROP CONSTRAINT IF EXISTS admin_market_research_pdf_rows_review_status_check;

ALTER TABLE public.admin_market_research_pdf_rows
  ADD CONSTRAINT admin_market_research_pdf_rows_review_status_check
  CHECK (review_status IN ('pending', 'approved', 'rejected', 'ingested', 'published'));
