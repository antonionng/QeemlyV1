# Market Staging And Publish Workflow Design

**Scope:** Redesign the shared-market admin workflow so inbox ingestion writes into true staging, the admin workbench can inspect both live and staged datasets before release, and `Publish Dataset` becomes the only step that promotes staged market data into the live Qeemly market layer.

## Goal

Make the admin workbench honest and reviewable by separating staged market data from the live Qeemly market dataset, while still showing enough staged detail across workbench pages for operators to validate freshness, benchmark coverage, and row-level changes before publishing.

## Intended Result

- Approved research rows ingested from `Inbox` no longer become live immediately.
- `Inbox` moves approved rows into a true staging area and reports that they are waiting for publish review.
- Admin workbench pages show both `Live` and `Staged` views or summaries where useful, so operators can compare what tenants see now against what is queued for release.
- `Benchmarks` in the admin workbench can inspect staged benchmark rows before publish.
- `Freshness & Quality` can inspect staged freshness and coverage signals before publish.
- `Publish` becomes the final promotion step that applies the staged market refresh into the live market pool and records the publish event.
- Tenant-facing market reads continue to use only the live canonical dataset until publish completes.
- The publish screen clearly communicates what is waiting to go live, including staged row counts and useful live-versus-staged comparison signals.

## Constraints

- Preserve the platform-first benchmark model. Live tenant reads must continue to come from the canonical shared-market pool until a deliberate publish action occurs.
- Keep the admin workbench as the place for pre-publish review. Tenant-facing product surfaces must not read staged data.
- Reuse the existing staging tables where possible instead of inventing a second parallel workflow unless the current staging tables are insufficient.
- Keep the admin pages understandable. Do not overload every page with giant side-by-side tables if a smaller dual-summary view communicates the state clearly.
- Maintain automated coverage for the workflow changes. This is a behavioral redesign, not just a copy update.

## Design Decisions

### Data Lifecycle

Split the market workflow into two explicit layers:

1. `Live shared-market dataset`
   - canonical source for tenant-facing reads
   - backed by `platform_market_benchmarks` and related live snapshot tables

2. `Staged shared-market dataset`
   - operator preview of the next publish candidate
   - backed by staging tables such as `platform_market_benchmarks_staging` and `public_benchmark_snapshots_staging`

Approved inbox rows should enter the staged workflow inputs without triggering the live swap. The live swap only happens inside the publish action.

This means:

- `Inbox ingest` writes approved research inputs into the same upstream source rows that the pool builder already consumes, then immediately performs a deterministic staged-only rebuild
- that staged-only rebuild must fully replace the staging tables from current source inputs, not append partial rows, so the staged preview is always the complete next-release candidate
- `Inbox ingest` must not call the final live swap
- `Publish Dataset` performs the final live promotion and publish-event recording

The intended lifecycle is:

1. operator approves rows in `Inbox`
2. ingest writes approved source rows
3. system synchronously rebuilds `platform_market_benchmarks_staging` and `public_benchmark_snapshots_staging` during the ingest request
4. admin workbench pages inspect those staging tables
5. `Publish Dataset` swaps the exact staged tables into the live canonical tables

Source-row rules for v1:

- approved research rows continue to be upserted into the upstream admin benchmark source rows consumed by the pool builder
- repeated ingest of the same approved row must be idempotent through the existing benchmark upsert key
- the staged rebuild is a full replace of staging tables from all currently approved upstream source rows, not an append of just the latest upload
- multiple inbox ingests therefore accumulate through upstream source rows, while each staged rebuild produces one complete next-release candidate

Shared-pool rebuild rule for v1:

- any existing workflow that currently calls the shared-market rebuild path and causes a live swap must be changed to staged-only rebuild behavior
- `Publish Dataset` becomes the only supported live-promotion entry point for shared-market data
- if a current call site cannot be safely converted in this change, it must be disabled or routed through the same staged-only path until publish owns live promotion consistently

### Admin Workbench Visibility

Use a dual-state model across the admin workbench:

- show `Live` state so operators know what tenants currently see
- show `Staged` state so operators know what will be released next

Recommended presentation pattern:

- top-level summary cards or labels show `Live` and `Staged` counts side by side
- pages that already show row lists, like admin `Benchmarks`, get an explicit section, filter, or tab for `Live` versus `Staged`
- quality and freshness pages show paired summaries and can drill into staged diagnostics without replacing the live dataset view

This avoids the ambiguity of a hidden toggle while keeping the workbench focused on the release process.

### Inbox Behavior

Update `Inbox` messaging and behavior so the operator flow is explicit:

- approving and ingesting PDF rows means `added to staged market review`, not `made live`
- the success message should direct the operator to `Publish` and related review pages
- upload and review statuses should distinguish `staged for publish` from `published`

If a row cannot yet produce a valid staged benchmark candidate, its status should remain in review with a clear operator reason.

Concrete status expectations for v1:

- upload-level status remains `reviewing` until at least one approved row is ingested into staging
- after a successful staged ingest, upload-level status becomes `staged` with notes that explicitly say `staged for publish review`
- row-level review status becomes `staged` after successful staged ingest
- after a successful dataset publish, upload-level status becomes `published` for uploads whose rows are included in the published staged candidate
- after a successful dataset publish, row-level review status becomes `published` for rows included in that promoted candidate
- inbox ingestion must never assign `published`

### Publish Page Role

The publish page becomes the release checkpoint and release action, not a passive governance page.

It should show:

- current live shared rows
- staged shared rows
- difference between staged and live, at least at the count level
- staged freshness and coverage summary
- clear statement that `Publish Dataset` is the step that makes staged data tenant-visible

If possible within scope, also show a small preview of changed benchmark triples or a `view staged benchmarks` link.

For v1, the minimum required publish comparison is:

- live row count
- staged row count
- row-count delta
- last live publish timestamp
- current staged rebuild timestamp if available

### Benchmarks And Freshness Pages

Admin workbench pages need staged preview support because operators must validate the staged dataset before publish.

- `Benchmarks` should allow inspecting staged shared-market rows separately from live rows
- `Freshness & Quality` should surface staged freshness and staged coverage signals in addition to the live state
- only the following pages are in scope for v1 staged visibility changes: `Inbox`, `Publish`, admin `Benchmarks`, and `Freshness & Quality`

The key requirement is that staged data becomes inspectable before publish, not hidden behind backend-only state.

For staged freshness in v1:

- reuse the same freshness calculation rules already used for live where possible
- compute staged summaries from the staged tables or the staged rebuild timestamp, not from the last live publish event
- if a metric cannot yet be computed separately for staging, show the live metric and explicitly label it as live-only instead of silently reusing it as staged

### Publish Action Semantics

`Publish Dataset` should:

- use the staged benchmark pool as the source of truth for the next release
- promote the staged dataset by swapping the full staged tables into the live canonical tables as a replace operation, not a merge
- therefore rows missing from staging are removed from live on publish, because staging is the complete next-release candidate
- invalidate the existing live market caches only after a successful live swap
- record the publish event after a successful live promotion

It should not recompute a different dataset from scratch in a way that ignores the staged preview the operator reviewed.

Publish failure behavior:

- publish must use one atomic database boundary for live swap plus publish-event recording, so either both succeed or neither does
- if publish fails, live tables remain unchanged
- cache invalidation happens only after that atomic publish transaction commits successfully
- concurrent publish attempts should be serialized with an explicit database-backed guard. For v1, a second concurrent publish attempt should fail fast with a conflict response rather than waiting
- staged rebuilds and publish must share the same coordination boundary. For v1, a publish operation must promote a specific staged snapshot version or hold a shared lock that prevents staging rebuilds from mutating the reviewed candidate mid-publish
- if a staged rebuild starts while publish is in progress, it should fail fast or defer, rather than altering the candidate being published

Destructive publish protection for v1:

- block publish if staged row count is zero
- block publish if the staged dataset fails the same exact-coverage gate the current publish path already uses, but evaluated against staged tables instead of live tables. In practice, v1 should require `missingExactTriples === 0` for the staged coverage summary before publish can proceed
- if the implementation can cheaply compute a large destructive delta warning, surface it before publish, but the minimum hard block is zero-row staged publish

### Testing

Coverage needs to prove the new lifecycle, not just visual labels.

- Add failing tests first for inbox ingest so approved rows are staged but not made live.
- Add API-level tests proving publish is now the only path that performs the live swap.
- Add admin page tests for staged-versus-live summaries on `Publish`, and staged visibility on `Benchmarks` and `Freshness & Quality`.
- Add regression tests proving tenant-facing market reads still use only the live canonical dataset until publish happens.
- Add tests proving failed publish leaves live data unchanged.
- Add tests proving the staged preview matches the dataset that publish promotes, using a deterministic staged artifact equality check such as row-count plus stable row identity or hash across the staged and promoted canonical row set.
- Add tests for cache invalidation ordering around successful publish.
- Add tests for duplicate inbox ingest idempotency.
- Add tests for concurrent publish attempts returning a conflict without altering live data.
- Add tests proving a staged rebuild cannot change the candidate during an in-flight publish.

## Acceptance Criteria

- Ingesting approved inbox rows no longer makes them live immediately.
- Admin workbench pages can inspect staged market data before publish.
- The publish page clearly shows both live and staged dataset state.
- `Publish Dataset` is the only action that promotes staged market rows into the live shared-market dataset.
- Tenant-facing market reads continue showing the previously published live dataset until publish completes.
- Messaging across inbox and publish accurately reflects staging versus live promotion.
- Failed publish attempts leave the live dataset unchanged.
- The dataset reviewed in staging is the exact dataset promoted by publish.
- Automated tests cover the staging-only ingest path, the publish promotion path, and the admin preview surfaces.
