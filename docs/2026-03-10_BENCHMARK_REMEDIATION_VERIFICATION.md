# Benchmark Remediation Verification

## Automated Verification
- `npm run test:unit`
- `npm run typecheck`

## Key Unit Coverage
- `web/tests/unit/benchmarks/platform-market-pool.test.ts`
  - Privacy threshold gating for pooled cohorts
  - Blended pooled row materialization across employee, uploaded, and admin sources
- `web/tests/unit/benchmarks/platform-market.test.ts`
  - Canonical pooled market rows take precedence over snapshot fallback
  - Snapshot and platform workspace fallbacks remain readable
- `web/tests/unit/employees/data-service.test.ts`
  - `People` employee positioning is market-first instead of workspace-first
- `web/tests/unit/salary-review/ai-plan-engine.test.ts`
  - Salary Review uses shared market precedence before workspace overlays

## Browser Validation Targets
1. Benchmark search
   - Search an exact market-backed role/location/level
   - Confirm unsupported non-GCC locations no longer proxy to Dubai
   - Confirm level comparison rows differ by level when benchmark coverage exists
2. People list and overview
   - Confirm `marketComparison` and band position align to the shared market pool
   - Confirm company overlays only fill gaps when market rows are missing
3. Salary Review
   - Confirm AI plan provenance resolves to the shared market pool first
   - Confirm workspace fallbacks appear only when the market pool has no exact or role-level match
4. Offer creation
   - Confirm offer creation rejects stale client-side math
   - Confirm saved `benchmark_snapshot` includes source, freshness, confidence, and sample size
5. Compliance
   - Confirm synthetic fallback is surfaced clearly in warnings
   - Confirm compliance payload includes `uses_synthetic_fallback` and `synthetic_fallback_domains`
6. Reports
   - Confirm report generation is blocked until a real composition engine exists
   - Confirm failed runs are marked failed, not success

## Rollout Criteria
### Phase A. Schema and writer
- Apply the new market-pool and raw-snapshot migrations
- Confirm `platform_market_benchmarks` fills from employee uploads, benchmark uploads, and admin ingestion

### Phase B. Controlled read-path switch
- Enable the canonical pooled table in a staging environment
- Verify `People`, Benchmark Search, Salary Review, and `v1/benchmarks` all read the same market rows

### Phase C. Trust surface hardening
- Verify offers reject invalid math server-side
- Verify compliance warnings expose synthetic fallback truthfully
- Verify reports no longer claim successful generated output while placeholder-only

### Phase D. Production readiness
- Confirm unit tests and typecheck are green on the release candidate
- Run the browser validation targets above against staging data
- Promote only after the market pool contains real rows and the primary flows are provenance-aware
