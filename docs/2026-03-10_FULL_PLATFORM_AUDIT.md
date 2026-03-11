# Qeemly Full Platform Audit

Date: 2026-03-10

## Executive Verdict

Qeemly is **not yet fully fit for purpose as a benchmark-first compensation platform** in the same class as Pave, Ravio, or other leading compensation benchmarking products.

The codebase shows a strong intended product model:
- platform market data should be the primary benchmark source
- tenant company bands should be a secondary overlay
- admin ingestion should maintain a shared market pool
- downstream product surfaces should use that pool consistently

That intended model is only partially implemented today.

What is real and promising:
- a real benchmark read layer exists via `web/lib/benchmarks/platform-market.ts`
- benchmark search is closer to market-first behavior than most other flows
- employee self-service is closer to the intended product model
- admin ingestion and market data operations have real scaffolding
- compliance and AI surfaces attempt to use benchmark context in meaningful ways

What currently blocks "fit for purpose" status:
- there is no confirmed tenant-to-pool anonymized aggregation pipeline
- major decision flows still prioritize workspace bands over platform market data
- reports are placeholder-grade but exposed as successful output
- compliance can fabricate seeded synthetic governance data when real data is absent
- integrations remain mostly scaffolded and non-production behind the feature flag
- provenance, freshness, and source trust are not carried consistently through user-facing flows

This audit was a **static code audit only**. It did not include live browser execution, seeded-data validation in a running environment, or production data verification.

## Audit Method

Each major feature area was reviewed against the same questions:
- Is the feature conceptually complete for the product promise?
- Is the flow wired end to end from UI to API to storage and back?
- Does it use the Qeemly market-data model correctly?
- Does it appear working, partial, misleading, placeholder, deferred, or broken?
- What additions are needed for competitiveness or reliability?

## Platform Feature Matrix

| Surface | Verdict | Fit For Purpose | Main Reason |
|---|---|---|---|
| Data product core | Misleading | No | Product language promises pooled anonymous market data, but implementation is seeded public snapshots plus platform-ingested rows, not proven tenant pooling |
| Admin ingestion and control tower | Partial | No | Solid scaffolding, but enforcement and provenance are incomplete |
| Market overview | Partial | Partly | Messaging is market-first, but it is mostly a stats page, not a full exploration workflow |
| Benchmark search and drilldown | Partial | Partly | Market-first search exists, but filters, location handling, and comparison views drift from reality |
| People list and overview analytics | Misleading | No | Core benchmark-derived metrics still come from workspace bands first |
| Employee profile detail | Partial | No | Rich profile data exists, but no benchmark explanation or provenance is included |
| Employee self-service | Partial | Closest | Uses market-first lookup, but lacks provenance and fallback clarity |
| Salary review | Misleading | No | Main workflow inherits workspace-first logic and AI uses a separate market path |
| Offer builder and offer exports | Partial | No | Can create offers, but audit trail and server-side validation are weak |
| Compliance | Partial | No | Strong benchmark integration, but synthetic fallback data can stand in for real governance records |
| General AI chat | Partial | Partly | Uses market data, but workspace metrics and coverage semantics are weak |
| Employee advisory AI | Partial | No | Market-first lookup exists, but prompt language can misstate source provenance |
| Reports | Placeholder | No | Generic report generation is stored as successful output |
| Upload workflow | Partial | Partly | Tenant upload flow is real, but it feeds tenant-scoped data only |
| Integrations | Deferred and scaffolded | No | Disabled in GA and backend sync is largely stubbed |
| Public benchmark marketing and preview | Teaser | No | Strong positioning, but public experience is driven by a single public snapshot row and demo framing |
| My Data | Partial | No | Standalone dataset storage exists, but product linkage is unclear |
| Relocation calculator | MVP | Limited | Explicitly labeled MVP, appears additive rather than benchmark-core |
| Billing | Deferred | Out of scope | Feature flag disabled |
| Developer API | Partial | Partly | Key creation is real, but benchmark API is workspace-scoped and not aligned to the platform-first benchmark model |
| Public API snapshot | Partial | Limited | Returns only the latest public snapshot row |

## Detailed Audit

### 1. Data Product Core

#### Verdict
**Critical gap.** The platform does not yet show a full implementation of the product thesis that tenant customer data is anonymously aggregated into the Qeemly market pool.

#### What exists
- `web/lib/benchmarks/platform-market.ts` defines the canonical market accessor and clearly states that market data is the primary benchmark source.
- Market reads prioritize:
  1. `public_benchmark_snapshots`
  2. `salary_benchmarks` under `PLATFORM_WORKSPACE_ID` with `source = 'market'`
- `web/lib/ingestion/worker.ts` performs fetch -> normalize -> DQ -> upsert into `salary_benchmarks` with `source = 'market'`
- `web/app/api/cron/ingestion/route.ts` and `web/app/api/admin/trigger/route.ts` can enqueue and run ingestion jobs
- `web/app/admin/(dashboard)/benchmarks/page.tsx` presents the market pool as "anonymized, aggregated market benchmark pool across contributing tenants"

#### What is missing or risky
- No confirmed code path aggregates tenant employee or tenant benchmark data into the shared public market pool
- No confirmed anonymization stage, cohort thresholding, suppression rules, or k-anonymity logic
- `public_benchmark_snapshots` are currently seeded deterministically in `supabase/migrations/20260305200000_seed_qeemly_market_benchmarks.sql`
- `raw_source_snapshots` are expected by the admin API, but the ingestion worker does not write them
- Ingestion source policy exists in `web/lib/ingestion/source-registry.ts`, but cron and admin trigger routes do not enforce `approved_for_commercial` and `needs_review`
- `web/lib/ingestion/worker.ts` falls back to the first workspace if `PLATFORM_WORKSPACE_ID` is missing, which risks contaminating a tenant workspace with platform market rows
- `web/app/api/v1/benchmarks/route.ts` is workspace-scoped only, so the external API does not expose the platform-first benchmark model

#### Fit-for-purpose conclusion
Qeemly currently has the **shape** of a benchmark network product, but not the proven pooled-market implementation required to support that claim.

### 2. Admin Ingestion And Platform Operations

#### Verdict
**Partial.** There is enough real structure to build on, but not enough enforcement or provenance to call it production-grade benchmark operations.

#### Strengths
- clear separation of admin pipeline, sources, benchmarks, freshness, snapshots, tenants, and users
- ingestion jobs, freshness metrics, and source registry concepts are present
- super-admin protection exists around admin routes

#### Gaps
- source approval policy is not consistently enforced in job creation
- raw source snapshot provenance is not persisted by the worker
- admin-managed market ingestion appears real for external sources, but there is no equivalent admin path for manual market CSV upload into the shared pool
- the admin benchmark UI claims an aggregated tenant pool without evidence of actual tenant contribution logic

#### Fit-for-purpose conclusion
Operations are **platform-like**, but still too incomplete and permissive for a benchmark product where provenance and data trust are central.

### 3. Market Overview

#### Verdict
**Partial.** Messaging is aligned with the benchmark thesis, but the flow is shallow.

#### What works
- `web/app/(dashboard)/dashboard/market/page.tsx` explicitly frames the page as market-first
- `web/app/api/benchmarks/stats/route.ts` reads platform market data via `fetchMarketBenchmarks()`
- workspace data is treated as a secondary overlay in page copy

#### Gaps
- `lastUpdated` is derived from workspace benchmark rows, not from the market pool itself
- the page summarizes counts and coverage only
- there is no deep tenant exploration of market slices, source mix, freshness by cohort, or quality by role/location/level

#### Fit-for-purpose conclusion
Useful as a high-level status view, but not yet a full market intelligence workflow.

### 4. Benchmark Search And Drilldown

#### Verdict
**Partial.** This is one of the stronger areas, but it still includes misleading UX and non-real controls.

#### What works
- `web/lib/benchmarks/data-service.ts` and `/api/benchmarks/search` are market-first in intent
- result UI carries source badges via `BenchmarkSourceBadge`
- drilldown and benchmark result flows are more aligned to the benchmark product than many adjacent surfaces

#### Gaps
- `web/lib/benchmarks/benchmark-state.ts` captures `industry`, `companySize`, `fundingStage`, and `employmentType`, but the benchmark fetch path does not use them
- non-GCC locations are proxied to `dubai`, which means UK searches can return GCC data
- `web/components/dashboard/benchmarks/benchmark-results.tsx` builds level comparison rows by reusing the same benchmark values for every level row
- there are multiple benchmark access patterns, which increases the risk of drift

#### Fit-for-purpose conclusion
The search flow is **directionally correct**, but users can still be shown confidently presented outputs that are not actually filtered or location-correct.

### 5. People List, Overview Analytics, And Company Metrics

#### Verdict
**Misleading.** This is one of the most important benchmark-product failures in the current platform.

#### What happens today
- `web/app/api/people/route.ts` returns both workspace benchmarks and market benchmarks
- `web/lib/employees/data-service.ts` maps those rows into employee-level metrics
- the actual benchmark precedence is:
  1. workspace exact
  2. workspace role+level fallback
  3. market exact
  4. market role+level fallback

#### Why this is a problem
- `marketComparison` can be derived from company bands rather than market data
- `bandPosition` can also be derived from company bands while still looking like a market-based signal
- `web/components/dashboard/people/people-table.tsx` displays band and market metrics with no provenance
- overview and department summaries inherit the same workspace-first logic, so downstream analytics are also skewed

#### Fit-for-purpose conclusion
This flow is **not fit for purpose** for a benchmark-first product. It behaves more like an internal pay-band management tool with optional market fallback.

### 6. Employee Profile Detail

#### Verdict
**Partial.** Profile data is rich, but benchmark explanation is missing.

#### What works
- `web/app/api/people/[id]/profile/route.ts` aggregates employee profile, compensation history, contribution snapshots, equity grants, visa records, and timeline

#### Gaps
- no benchmark payload is returned
- no market versus workspace provenance is exposed
- the detail page cannot explain why the employee is in-band, above, below, or at a given market delta

#### Fit-for-purpose conclusion
The profile flow is operationally useful, but incomplete as a compensation-benchmarking decision surface.

### 7. Employee Self-Service

#### Verdict
**Partial but stronger.**

#### What works
- `web/lib/employee.ts` uses `findMarketBenchmark()` first, then falls back to workspace bands
- employee advisory chat follows the same general lookup order
- this is the clearest example of the intended market-first product model in the tenant experience

#### Gaps
- no explicit source badge or provenance explanation in the self-service UI
- no explanation when no benchmark is available
- matching is strict exact-match only, which can reduce coverage relative to other flows
- base salary vs total compensation logic is not clearly separated in the employee-facing explanation

#### Fit-for-purpose conclusion
This flow is among the best-aligned with the product thesis, but it still needs trust and explainability improvements.

### 8. Salary Review

#### Verdict
**Misleading.** Another major benchmark-product weakness.

#### What happens today
- the main salary review flow inherits People-derived employee metrics, so it inherits workspace-first benchmark precedence
- the AI plan route in `web/app/api/salary-review/ai-plan/route.ts` does not use `platform-market.ts`
- instead it fetches:
  - workspace rows from the current workspace
  - ingestion rows from any non-current workspace where `source = 'market'`

#### Why this is a problem
- the AI plan uses a different definition of "market" than benchmark search and employee self-service
- the table and employee guidance can reflect internal policy bands before market positioning
- provenance is shown in the AI modal, but not consistently in the broader salary review workflow
- quick-add and employee creation paths can default `employment_type` in ways that affect downstream benchmarking

#### Fit-for-purpose conclusion
Salary review is **not yet reliable enough** to claim benchmark-grounded compensation planning.

### 9. Offer Builder And Offer Exports

#### Verdict
**Partial.**

#### What works
- offer creation flow exists end to end
- offer payloads can be persisted and exported as JSON
- the builder uses benchmark search outputs to generate ranges

#### Gaps
- `offerTarget` is effectively fixed from company settings in `offer-builder-view.tsx`
- `basicPercent` is fixed to `100`, making the salary breakdown mostly decorative
- saved `benchmark_snapshot` omits provenance, freshness, confidence, sample size, and match quality
- `/api/offers/route.ts` trusts client-calculated offer values and benchmark snapshot rather than recomputing or validating them
- export types advertise `PDF` and `DOCX`, but the actual practical export path is JSON payload download
- employee recipient selection is not filtered to relevant benchmarked employees

#### Fit-for-purpose conclusion
Good prototype-level workflow, but not audit-grade or approval-grade compensation tooling yet.

### 10. Compliance

#### Verdict
**Partial with a major trust risk.**

#### What works
- `web/lib/compliance/snapshot-service.ts` merges market benchmarks first, then workspace data fills gaps
- benchmark coverage, in-band/out-of-band, parity, deadlines, visa risk, and policy completion are incorporated into a single compliance score
- this is one of the cleanest market-first merge implementations in the product

#### Critical gap
- if key datasets are empty, `buildSyntheticComplianceRows()` generates seeded policies, regulatory updates, deadlines, visa cases, documents, and audit events
- those seeded rows are used when real rows are absent

#### Why this matters
- the dashboard can appear richly populated even without real compliance operational data
- the fallback is flagged in subsystem warnings, but the top-level product experience can still look real to a user
- export is disabled in the UI, reinforcing that the workflow is not fully productized yet

#### Fit-for-purpose conclusion
Promising architecture, but not trustworthy enough yet for a customer-facing governance product without clearer separation of synthetic and real data.

### 11. AI Chat And Advisory

#### General AI chat
Verdict: **Partial**

What works:
- `web/lib/ai/chat/general.ts` loads market data via `fetchMarketBenchmarks()`
- workspace context and market context are both included

Gaps:
- workspace `benchmark_count` is not a true market coverage indicator
- the assistant can speak about market data well, but underlying coverage semantics are still weak

#### Employee advisory AI
Verdict: **Partial**

What works:
- `web/lib/ai/chat/employee.ts` uses market benchmark first, then workspace benchmark second
- peer context and compensation history are included

Gaps:
- prompt text says benchmark data comes from the Qeemly market data pool even when the actual selected benchmark may be a workspace fallback
- returned grounded context only says whether a benchmark was used, not which source was used

#### Fit-for-purpose conclusion
AI is useful as an augmentation layer, but explainability and source fidelity still need work.

### 12. Reports

#### Verdict
**Placeholder.**

#### What exists
- reports can be created, listed, generated, and run
- starter reports are seeded automatically for a workspace
- templates reference meaningful benchmark and compliance dependencies

#### What actually happens
- `web/lib/reports/generation.ts` returns generic metadata, generic summary text, and stock "Highlights" / "Next Actions"
- `/api/reports/[id]/generate` marks runs successful and marks the report `Ready`
- `/api/reports/route.ts` seeds starter reports and can fall back to hardcoded starter reports if templates are missing
- `web/components/dashboard/reports/new-report-modal.tsx` still contains placeholder copy including `Lorem ipsum`

#### Fit-for-purpose conclusion
Reports are **not product-ready**. They present as real reporting but do not yet execute real report logic.

### 13. Upload Workflow

#### Verdict
**Partial but real.**

#### What works
- upload wizard and upload APIs exist
- employee and benchmark uploads write to tenant-scoped tables
- upload audit records and best-effort freshness sync are present

#### Gaps
- uploaded company data remains tenant-scoped
- no follow-on flow contributes tenant data into the shared market pool
- upload is useful for tenant operations, but not yet part of a true benchmark-network flywheel

#### Fit-for-purpose conclusion
Solid tenant import foundation, but disconnected from the shared benchmark thesis.

### 14. Integrations

#### Verdict
**Deferred and scaffolded.**

#### Evidence
- `web/lib/release/ga-scope.ts` disables integrations in GA
- `web/app/(dashboard)/dashboard/integrations/page.tsx` renders a feature-disabled state
- OAuth callback marks integrations connected without performing token exchange
- webhook handlers verify signatures but mostly contain TODOs
- `web/lib/ingestion/integration-sync.ts` has a stubbed provider fetch returning `[]`

#### Fit-for-purpose conclusion
This is correctly classified as deferred, not production-ready.

### 15. Developer API And Public API

#### Verdict
**Partial.**

#### What works
- developer API key creation and listing are real in `web/app/api/developer/api-keys/route.ts`
- key hashing and prefixing suggest reasonable API key hygiene

#### Gaps
- benchmark v1 API is workspace-scoped only and does not expose platform market benchmarks as the primary source
- posted benchmark rows accept client-provided `source` without strong validation
- public benchmark API returns only the latest public snapshot row, not a meaningful product surface

#### Fit-for-purpose conclusion
Foundational external API pieces exist, but they do not yet fully express the platform-first benchmark model.

### 16. Marketing, Preview, My Data, Relocation, Billing

#### Marketing and preview
Verdict: **Teaser**

Evidence:
- `web/app/(marketing)/search/page.tsx` explicitly describes demo values on the site
- the public benchmark experience is built from the latest public snapshot row and strong visual/product copy

#### My Data
Verdict: **Partial**

Evidence:
- `web/app/(dashboard)/dashboard/my-data/page.tsx` supports CSV upload to storage and dataset metadata
- linkage from these datasets into the main benchmarking or ingestion product is unclear

#### Relocation
Verdict: **MVP**

Evidence:
- explicitly labeled `MVP` in `web/app/(dashboard)/dashboard/relocation/page.tsx`

#### Billing
Verdict: **Deferred**

Evidence:
- billing is disabled by `ga-scope`
- route returns `FeatureNotEnabled` before the billing UI matters

## High-Risk Platform Gaps

### Critical
- No confirmed anonymous tenant-to-pool aggregation pipeline
- People and salary review still prioritize workspace bands over the market pool
- Reports present placeholder output as successful generated reports

### High
- Compliance can substitute seeded synthetic operational records for missing real data
- Provenance, freshness, confidence, and sample size are not carried consistently through user-facing outputs
- Benchmark search UI exposes filters and location coverage that are not truly supported
- Salary review AI uses a different benchmark-access path than the rest of the product

### Medium
- Offer builder lacks server-side validation and audit-grade benchmark snapshots
- External benchmark API is not aligned with the product's market-first contract
- Public benchmark surface is more teaser than product
- My Data is loosely connected to core benchmarking workflows

### Low
- Placeholder copy remains in some UI surfaces
- Several supporting tools are intentionally deferred, MVP, or teaser-grade

## Benchmark Competitiveness Gap List

Qeemly is not yet equivalent to a benchmark-first competitor because it still lacks several essentials:

1. **A real customer-contributed market pool**
   The product promise says customer data is anonymized into a shared pool. The code reviewed does not yet prove that pipeline exists.

2. **Consistent benchmark precedence everywhere**
   A benchmark product cannot show market-first logic in one screen and workspace-first logic in another.

3. **Trustworthy provenance in every decision surface**
   Users need to know whether a number came from market data, their own band overlay, seeded data, or a synthetic fallback.

4. **Real reporting and export artifacts**
   Benchmark products win when outputs are defensible. Placeholder reports and thin export payloads weaken trust immediately.

5. **Market-quality controls**
   Approval enforcement, freshness fidelity, source lineage, cohort thresholds, and anonymization rules must be operational, not implied.

## Prioritized Remediation Roadmap

### Must Fix To Make The Benchmark Product Credible

1. Build the tenant-to-pool aggregation pipeline.
   - Aggregate tenant-contributed compensation data into anonymous cohorts
   - Enforce privacy thresholds before publishing pooled market slices
   - Publish resulting aggregates into `public_benchmark_snapshots` or a dedicated market store

2. Standardize benchmark precedence across the product.
   - Use platform market data first everywhere
   - Use company bands only as explicit overlay logic
   - Replace custom benchmark lookups in salary review with `platform-market.ts`

3. Carry provenance end to end.
   - Every computed benchmark output should include source, freshness, confidence, and match quality
   - Display provenance in People, Salary Review, self-service, offers, AI, and exports

4. Stop presenting placeholder report output as successful reporting.
   - Either disable report generation until real generation exists
   - Or implement real report assembly against actual report dependencies

### Must Fix To Make Major Flows Reliable End To End

1. Correct People and overview analytics so `marketComparison` and band signals are truly market-based by default.
2. Correct benchmark search so unsupported filters and fake location routing are removed or fully implemented.
3. Add benchmark context to employee profile flows.
4. Validate offer math and benchmark snapshots server-side.
5. Improve market freshness semantics so market freshness is not derived from workspace-only rows.

### Should Add To Close Competitive Gaps

1. Add admin/manual upload into the shared market layer with full provenance.
2. Add richer market exploration workflows in the Market page.
3. Add benchmark-source explanation and "why this result" UI in self-service and advisory surfaces.
4. Upgrade exports to include audit-grade benchmark metadata.
5. Align external benchmark APIs with the platform market contract.

### Can Defer Because The Feature Is Explicitly Out Of Scope

1. Billing
2. Integrations, until the feature flag is lifted
3. Advanced report builder, if the interim report experience is clearly marked limited
4. Relocation enhancements beyond its current MVP positioning

## Recommended Next Execution Order

1. Fix the benchmark data model and pooled market pipeline first.
2. Unify benchmark precedence across People, Overview, Salary Review, and Self-Service.
3. Add provenance and trust metadata to every benchmark-driven output.
4. Replace placeholder reports with either real generation or explicit limited-state UX.
5. Tighten compliance truthfulness around synthetic fallback.
6. Revisit integrations and external APIs after the benchmark core is trustworthy.

## Final Platform Verdict

Qeemly currently looks like a **strong benchmark-product prototype with several real foundations**, but it is **not yet a fully trustworthy, end-to-end benchmark platform**.

The most important distinction is this:
- the product story is already benchmark-first
- parts of the codebase are already benchmark-first
- the platform as a whole is **not yet consistently benchmark-first**

Until the pooled data model is truly implemented, benchmark precedence is unified, provenance is visible everywhere, and placeholder/synthetic experiences are tightened, Qeemly should be considered **partial and promising**, not fully fit for purpose as a mature benchmark competitor.
