ALTER TABLE salary_benchmarks
ADD COLUMN IF NOT EXISTS market_source_slug TEXT;

ALTER TABLE salary_benchmarks
ADD COLUMN IF NOT EXISTS market_origin TEXT
CHECK (market_origin IN ('live_ingestion', 'bootstrap', 'tenant_upload', 'tenant_employee', 'manual_admin'));
