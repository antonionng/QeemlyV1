DELETE FROM salary_benchmarks
WHERE workspace_id IN (
  '91000000-0000-0000-0000-000000000001'::uuid,
  '91000000-0000-0000-0000-000000000002'::uuid,
  '91000000-0000-0000-0000-000000000003'::uuid
)
  AND source = 'market';

DELETE FROM platform_market_benchmarks
WHERE valid_from = DATE '2026-03-12'
  AND provenance = 'admin';

DELETE FROM public_benchmark_snapshots
WHERE workspace_id IS NULL
  AND updated_at::date = DATE '2026-03-12';

DELETE FROM workspace_settings
WHERE workspace_id IN (
  '91000000-0000-0000-0000-000000000001'::uuid,
  '91000000-0000-0000-0000-000000000002'::uuid,
  '91000000-0000-0000-0000-000000000003'::uuid
);

DELETE FROM workspaces
WHERE id IN (
  '91000000-0000-0000-0000-000000000001'::uuid,
  '91000000-0000-0000-0000-000000000002'::uuid,
  '91000000-0000-0000-0000-000000000003'::uuid
);
