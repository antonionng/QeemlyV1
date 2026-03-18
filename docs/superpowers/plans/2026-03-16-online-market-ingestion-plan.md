# Online Market Ingestion Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Qeemly's platform benchmark product with approved online market sources, add official versus proxy source semantics, and make the platform pool refresh safe and truthful.

**Architecture:** Keep the existing ingestion pipeline as the single path for online market data. Source adapters fetch approved online data into `salary_benchmarks` under `PLATFORM_WORKSPACE_ID`, then a safer `refreshPlatformMarketPool()` rebuilds tenant-visible platform rows and supporting public snapshots without destructive silent failures. Coverage reporting is extended to separate official exact coverage from total published exact coverage.

**Tech Stack:** Next.js route handlers, React admin UI, TypeScript domain helpers, Supabase Postgres migrations, Vitest unit and route tests

---

## Chunk 1: Refresh Reliability

### Task 1: Lock failing refresh-write behavior with tests

**Files:**
- Modify: `web/tests/unit/api/admin-market-seed-route.test.ts`
- Create: `web/tests/unit/benchmarks/platform-market-pool-refresh.test.ts`
- Test: `web/tests/unit/benchmarks/platform-market-pool-refresh.test.ts`

- [ ] **Step 1: Write the failing test**

Add focused tests that reproduce the current refresh risks:

- a failed `platform_market_benchmarks` delete should throw
- a failed `platform_market_benchmarks` insert should throw
- a failed `public_benchmark_snapshots` delete or insert should throw
- a failed refresh must not report a successful `rowCount`

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/benchmarks/platform-market-pool-refresh.test.ts`

Expected: FAIL because `refreshPlatformMarketPool()` does not currently inspect Supabase write errors.

- [ ] **Step 3: Write minimal implementation**

Update `web/lib/benchmarks/platform-market-pool.ts` so refresh writes are checked and failures throw explicit errors instead of being ignored.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/benchmarks/platform-market-pool-refresh.test.ts`

Expected: PASS

### Task 2: Make refresh non-destructive

**Files:**
- Modify: `web/lib/benchmarks/platform-market-pool.ts`
- Create: `supabase/migrations/20260316181000_add_market_pool_refresh_staging.sql`
- Test: `web/tests/unit/benchmarks/platform-market-pool-refresh.test.ts`

- [ ] **Step 1: Write the failing test**

Add a test that simulates a partial refresh failure and proves the implementation must not clear live rows before the replacement dataset is safely written.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/benchmarks/platform-market-pool-refresh.test.ts`

Expected: FAIL because the current implementation deletes live rows before inserts complete.

- [ ] **Step 3: Write minimal implementation**

Implement an explicit staging-and-swap path:

- add staging tables in `supabase/migrations/20260316181000_add_market_pool_refresh_staging.sql`
- write the next full dataset into staging tables first
- verify both staging writes succeed
- swap staging contents into `platform_market_benchmarks` and `public_benchmark_snapshots`
- clear staging only after the live swap succeeds

The implementation must preserve existing `labelForRole()`, `labelForLocation()`, and `labelForLevel()` behavior.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/benchmarks/platform-market-pool-refresh.test.ts`

Expected: PASS

## Chunk 2: Source Tier Foundation

### Task 3: Add source-tier schema and type support

**Files:**
- Create: `supabase/migrations/20260316180000_add_ingestion_source_tiers.sql`
- Create: `supabase/migrations/20260316182000_add_market_source_tier_columns.sql`
- Modify: `web/lib/ingestion/source-registry.ts`
- Modify: `web/lib/ingestion/worker.ts`
- Test: `web/tests/unit/ingestion/adapters-registry.test.ts`

- [ ] **Step 1: Write the failing test**

Extend `web/tests/unit/ingestion/adapters-registry.test.ts` to assert that official GCC sources and proxy-support sources resolve to the expected tier semantics.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/ingestion/adapters-registry.test.ts`

Expected: FAIL because no source-tier helper or schema-backed tier exists yet.

- [ ] **Step 3: Write minimal implementation**

Implement the first tier foundation:

- add a new `tier` column on `ingestion_sources` with allowed values `official` and `proxy`
- seed sensible defaults for current sources in the migration
- add row-level tier columns needed to persist effective source support on:
  - `salary_benchmarks`
  - `platform_market_benchmarks`
  - `public_benchmark_snapshots`
- extend `IngestionSource` typing in `web/lib/ingestion/source-registry.ts`
- add helper(s) for tier lookup and validation without weakening `isSourceAllowedForIngestion()`
- update `web/lib/ingestion/worker.ts` so ingested market rows persist source-tier metadata on write

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/ingestion/adapters-registry.test.ts`

Expected: PASS

### Task 4: Enforce server-side approval and tier rules in ingestion

**Files:**
- Modify: `web/lib/ingestion/worker.ts`
- Modify: `web/lib/ingestion/source-registry.ts`
- Create: `web/tests/unit/ingestion/worker-source-gating.test.ts`
- Test: `web/tests/unit/ingestion/worker-source-gating.test.ts`

- [ ] **Step 1: Write the failing test**

Add worker-level tests proving:

- disabled, review-blocked, or commercially unapproved sources are rejected even if invoked directly
- approved sources continue through the existing fetch, normalize, DQ, and upsert flow

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/ingestion/worker-source-gating.test.ts`

Expected: FAIL because `runIngestionForJob()` currently trusts the source record too loosely.

- [ ] **Step 3: Write minimal implementation**

Update `web/lib/ingestion/worker.ts` to fetch the full source record, apply the same approval gate server-side, and return a failed result before any fetch or write if the source is not allowed.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/ingestion/worker-source-gating.test.ts`

Expected: PASS

## Chunk 3: Tier-Aware Pooling And Reporting

### Task 5: Preserve official versus proxy support through pooling

**Files:**
- Modify: `web/lib/benchmarks/platform-market-pool.ts`
- Modify: `web/lib/benchmarks/platform-market.ts`
- Create: `web/tests/unit/benchmarks/platform-market-pool-tiering.test.ts`
- Modify: `web/tests/unit/benchmarks/platform-market.test.ts`
- Test: `web/tests/unit/benchmarks/platform-market-pool-tiering.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests that lock the tier-aware publish semantics:

- official support wins for a tenant-visible exact cohort when official and proxy data both exist
- proxy-backed exact rows are allowed only when no official exact cohort exists
- segmented variants follow the same precedence rules
- pooled rows preserve enough metadata to distinguish official-only, proxy-only, and blended support for reporting

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/benchmarks/platform-market-pool-tiering.test.ts`

Expected: FAIL because the pool currently treats market rows as a single undifferentiated `admin` source type.

- [ ] **Step 3: Write minimal implementation**

Refactor `web/lib/benchmarks/platform-market-pool.ts` so market observations carry tier-aware metadata and the aggregation path can enforce official-first publish precedence without changing tenant-facing read APIs.

Store new semantics without overloading the existing pooled `provenance` field:

- keep `provenance` for source-family semantics such as `employee`, `uploaded`, `admin`, or `blended`
- store official, proxy, or blended tier support in dedicated row-level metadata columns added in `20260316182000_add_market_source_tier_columns.sql`
- update `web/lib/benchmarks/platform-market.ts` so the shared accessor can expose the new tier metadata to coverage and admin reporting helpers

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/benchmarks/platform-market-pool-tiering.test.ts`

Expected: PASS

### Task 6: Add official and proxy coverage reporting

**Files:**
- Modify: `web/lib/benchmarks/coverage-contract.ts`
- Modify: `web/app/api/admin/market-seed/route.ts`
- Modify: `web/app/api/admin/market-publish/route.ts`
- Modify: `web/app/admin/(dashboard)/publish/page.tsx`
- Modify: `web/tests/unit/api/admin-market-seed-route.test.ts`
- Modify: `web/tests/unit/api/admin-market-publish-route.test.ts`
- Modify: `web/tests/unit/admin/publish-page.test.ts`
- Create: `web/tests/unit/benchmarks/coverage-contract-tiering.test.ts`
- Test: `web/tests/unit/benchmarks/coverage-contract-tiering.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests for new coverage summaries that clearly define:

- official exact coverage
- proxy-backed exact coverage
- total published exact coverage
- exact triple union rules when both official and proxy support exist

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/benchmarks/coverage-contract-tiering.test.ts tests/unit/api/admin-market-seed-route.test.ts tests/unit/admin/publish-page.test.ts`

Expected: FAIL because current coverage summaries only report one combined bucket.

- [ ] **Step 3: Write minimal implementation**

Update:

- `web/lib/benchmarks/coverage-contract.ts` to expose tier-aware coverage summaries
- `web/app/api/admin/market-seed/route.ts` to return those summaries
- `web/app/api/admin/market-publish/route.ts` to return the same updated coverage contract on publish and publish-block responses
- `web/app/admin/(dashboard)/publish/page.tsx` to render official coverage separately from total published coverage

Keep the existing grouped-gap and top-missing-triple reporting in place.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/benchmarks/coverage-contract-tiering.test.ts tests/unit/api/admin-market-seed-route.test.ts tests/unit/admin/publish-page.test.ts`

Expected: PASS

## Chunk 4: Online Source Onboarding

### Task 7: Add one vetted proxy onboarding slice

**Files:**
- Modify: `web/lib/ingestion/source-registry.ts`
- Modify: `web/lib/ingestion/adapters/wb-gcc-wage-workers.ts`
- Modify: `web/tests/unit/ingestion/adapters-registry.test.ts`
- Create: `web/tests/unit/ingestion/wb-gcc-wage-workers.test.ts`

- [ ] **Step 1: Write the failing test**

Use `wb_gcc_wage_workers` as the first explicit proxy onboarding slice. Add tests that prove:

- `getSourceTier("wb_gcc_wage_workers")` resolves to `proxy`
- the adapter remains registered
- the adapter output continues to normalize into valid benchmark rows
- the tier metadata associated with those rows is preserved into the worker write path expectations

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/ingestion/adapters-registry.test.ts [source-specific-test]`

Expected: FAIL because `wb_gcc_wage_workers` is not yet wired to the new tier-aware behavior.

- [ ] **Step 3: Write minimal implementation**

Implement the smallest useful online slice:

- keep GCC official sources as `official`
- mark `wb_gcc_wage_workers` as `proxy`
- ensure the adapter output continues through normalizer, DQ, and worker upsert unchanged except for new tier metadata

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/ingestion/adapters-registry.test.ts tests/unit/ingestion/wb-gcc-wage-workers.test.ts`

Expected: PASS

### Task 8: Add revocation behavior

**Files:**
- Modify: `web/lib/benchmarks/platform-market-pool.ts`
- Modify: `web/lib/ingestion/source-registry.ts`
- Create: `web/tests/unit/benchmarks/platform-market-pool-revocation.test.ts`
- Test: `web/tests/unit/benchmarks/platform-market-pool-revocation.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests proving that rows from review-blocked, disabled, or commercially unapproved sources stop contributing to newly published platform rows on refresh.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/benchmarks/platform-market-pool-revocation.test.ts`

Expected: FAIL because current pooling reads market rows without tier or revocation-aware filtering.

- [ ] **Step 3: Write minimal implementation**

Update the refresh aggregation path so only currently approved sources contribute to fresh pooled output, while historical raw rows can remain for audit purposes.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/benchmarks/platform-market-pool-revocation.test.ts`

Expected: PASS

## Chunk 5: Verification

### Task 9: Run focused verification suite

**Files:**
- Modify: `web/lib/benchmarks/platform-market-pool.ts`
- Modify: `web/lib/benchmarks/coverage-contract.ts`
- Modify: `web/lib/ingestion/source-registry.ts`
- Modify: `web/lib/ingestion/worker.ts`
- Modify: `web/app/api/admin/market-seed/route.ts`
- Modify: `web/app/admin/(dashboard)/publish/page.tsx`
- Modify: relevant unit tests from earlier tasks

- [ ] **Step 1: Run the targeted test suite**

Run:
`npx vitest run tests/unit/benchmarks/platform-market-pool-refresh.test.ts tests/unit/benchmarks/platform-market-pool-tiering.test.ts tests/unit/benchmarks/platform-market-pool-revocation.test.ts tests/unit/benchmarks/coverage-contract-tiering.test.ts tests/unit/benchmarks/platform-market.test.ts tests/unit/ingestion/adapters-registry.test.ts tests/unit/ingestion/worker-source-gating.test.ts tests/unit/ingestion/wb-gcc-wage-workers.test.ts tests/unit/api/admin-market-seed-route.test.ts tests/unit/api/admin-market-publish-route.test.ts tests/unit/admin/publish-page.test.ts`

Expected: PASS

- [ ] **Step 2: Run lint diagnostics on edited files**

Use workspace diagnostics on all edited files and resolve any newly introduced issues.

- [ ] **Step 3: Re-check live pool behavior manually**

Run a hosted read or equivalent admin-triggered verification to confirm:

- platform refresh no longer reports false success
- live `platform_market_benchmarks` rows exist after a successful refresh
- official and total coverage numbers returned by the API are internally consistent

- [ ] **Step 4: Review diff against scope**

Confirm this plan only changes:

- refresh safety
- source-tier semantics
- approved-source enforcement
- tier-aware coverage reporting
- one small vetted online onboarding slice

Do not expand into unrelated benchmark UI redesign or tenant benchmark read-path changes.
