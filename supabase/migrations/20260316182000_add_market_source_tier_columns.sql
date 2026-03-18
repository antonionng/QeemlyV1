ALTER TABLE salary_benchmarks
  ADD COLUMN IF NOT EXISTS market_source_tier TEXT CHECK (market_source_tier IN ('official', 'proxy'));

ALTER TABLE platform_market_benchmarks
  ADD COLUMN IF NOT EXISTS market_source_tier TEXT CHECK (market_source_tier IN ('official', 'proxy', 'blended'));

ALTER TABLE platform_market_benchmarks_staging
  ADD COLUMN IF NOT EXISTS market_source_tier TEXT CHECK (market_source_tier IN ('official', 'proxy', 'blended'));

ALTER TABLE public_benchmark_snapshots
  ADD COLUMN IF NOT EXISTS market_source_tier TEXT CHECK (market_source_tier IN ('official', 'proxy', 'blended'));

ALTER TABLE public_benchmark_snapshots_staging
  ADD COLUMN IF NOT EXISTS market_source_tier TEXT CHECK (market_source_tier IN ('official', 'proxy', 'blended'));
