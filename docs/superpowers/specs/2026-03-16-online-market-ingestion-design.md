# Online Market Ingestion Design

**Scope:** Expand the Qeemly platform benchmark dataset with approved online sources, preserve the platform-first benchmark model, distinguish official GCC sources from vetted proxy sources, and make platform pool refreshes fail loudly if tenant-visible rows are not actually written.

## Goal

Increase exact benchmark coverage for the Qeemly market product without weakening trust, licensing controls, or publish reliability.

## Intended Result

- Qeemly can ingest additional approved online market sources through the existing ingestion pipeline.
- Every online source is classified so the platform can distinguish official GCC market data from vetted proxy support data.
- The platform pool refresh path fails loudly on write errors instead of reporting success based only on in-memory aggregation.
- Admin coverage reporting separates official exact coverage from total published exact coverage.
- Tenant-visible market rows continue to use the platform market pool as the primary benchmark source.

## Constraints

- Keep the existing platform-first benchmark model intact:
  - raw or normalized market rows land in `salary_benchmarks` under `PLATFORM_WORKSPACE_ID`
  - tenant-facing benchmark reads continue to come from `platform_market_benchmarks` through `web/lib/benchmarks/platform-market.ts`
- Only ingest sources that are enabled, approved for commercial reuse, and not marked for review.
- Do not add an alternate path that bypasses normalization, DQ, or publish controls.
- Preserve provenance so published rows can still explain whether they are official, proxy-backed, or blended.
- Coverage gains must not rely on silent refresh failures or ambiguous success messaging.

## Design Decisions

### Source Strategy

Use a two-tier online source model:

- **Official**: GCC official or government labor and compensation sources that are approved for commercial use.
- **Proxy**: vetted online sources that help fill exact benchmark gaps when official exact data is absent.

The recommended product behavior is official-first, not official-only. Official data should remain the preferred benchmark source, but proxy-supported rows are allowed to fill exact gaps if they pass the same ingestion, mapping, DQ, and publish controls.

### Data Model And Flow

All new online data should follow the existing Qeemly benchmark flow:

1. registered source adapter fetches raw online rows
2. rows are normalized into canonical `role_id`, `level_id`, `location_id`, `industry`, and `company_size`
3. DQ validation filters invalid or weak rows
4. approved normalized rows are upserted into `salary_benchmarks` with `source = 'market'` under `PLATFORM_WORKSPACE_ID`
5. `refreshPlatformMarketPool()` aggregates publishable rows into `platform_market_benchmarks`
6. tenant-facing APIs and dashboards read from the platform pool

This keeps the product aligned with the Qeemly benchmark model, where platform market data is the primary benchmark and tenant overlays remain supplementary.

### Source Tiering

The ingestion system should gain an explicit notion of source tier. The simplest version is a field or config value on `ingestion_sources` that marks each approved source as:

- `official`
- `proxy`

This tier should not live only on `ingestion_sources`. It must survive at row level so later aggregation and reporting are deterministic. At minimum:

- raw ingested `salary_benchmarks` market rows must retain source tier context
- pooled `platform_market_benchmarks` rows must preserve whether support is official-only, proxy-only, or blended
- `public_benchmark_snapshots` must receive the same effective source labeling as the platform pool

The goal is not to create a separate storage path per tier. The goal is to preserve source intent all the way through reporting, publishing, and audits.

### Publish Rules

Publishing should follow two lanes:

- **Official-first lane**: if an exact role, level, and location triple has approved official coverage, that row should be publishable as the preferred market result.
- **Gap-fill lane**: if an exact triple does not have official support, a vetted proxy-backed row may publish if it passes all quality and commercial gates.

Precedence must be deterministic:

- precedence is resolved per exact cohort, including segmented variants when `industry` and or `company_size` are present
- for a given exact cohort, official support outranks proxy-only support
- if both official and proxy rows exist for the same exact cohort, the published cohort should aggregate only official support for the tenant-visible exact row

Proxy data should never outrank stronger official support for the same exact cohort. Blended publication is allowed only when no official-only cohort exists for that exact published row and the product intentionally combines multiple approved supports. When published data is blended or proxy-backed, provenance must remain visible in admin reporting and available for downstream UI trust labeling.

### Refresh Reliability

The current refresh path should be treated as unreliable until it verifies write success. `refreshPlatformMarketPool()` currently calculates a `rowCount` from in-memory aggregation but does not fail if the underlying Supabase delete or insert operations return an error.

The refresh path should:

- check delete errors on `platform_market_benchmarks`
- check insert errors on `platform_market_benchmarks`
- check delete and insert errors on `public_benchmark_snapshots`
- throw on any failed write so admin seed or refresh actions fail loudly

Error checking alone is not sufficient because the current pattern is destructive. The refresh design should avoid leaving tenant-visible datasets empty after a partial failure. Prefer one of:

- a transaction that replaces both targets atomically, or
- a staging-and-swap flow that writes the full next dataset, verifies it, then swaps it into the live tables

This reliability fix should be implemented before using new online coverage metrics to guide product decisions.

### Revocation And Source Retirement

If a source later becomes review-blocked, disabled, or loses commercial approval, its rows must stop contributing to newly published platform market data. On the next refresh:

- blocked sources are excluded from aggregation
- any exact triples that relied only on the blocked source lose that support unless another approved source still covers them
- coverage reporting should reflect the post-revocation reality rather than preserving historical support

Historical raw rows may remain for audit purposes, but they must not continue to power tenant-visible platform benchmarks once the source is no longer approved.

### Coverage Reporting

Admin reporting should stop treating all exact coverage as a single bucket. It should expose at least:

- official exact coverage
- proxy-backed exact coverage
- total published exact coverage

These buckets must be defined clearly:

- `official exact coverage`: exact triples with published support from official sources
- `proxy-backed exact coverage`: exact triples that are published only because proxy support filled an otherwise missing official gap
- `total published exact coverage`: union of all published exact triples, counted once per exact triple

If an exact triple has both official and proxy support, it still counts once in total coverage and should count as official coverage, not proxy-only coverage.

This reporting should appear alongside the existing grouped gap reports and concrete missing exact triple reports so operators can see both:

- where coverage is missing
- how much of current coverage is official vs proxy-supported

### Rollout Priority

The safest execution order is:

1. fix refresh-path write verification
2. add source-tier metadata and reporting hooks
3. onboard a small number of vetted online proxy families through the existing adapter registry
4. rerun coverage reporting and measure the change in exact tenant-visible coverage

### Enforcement Point

Source approval and tier rules must be enforced server-side in the ingestion execution path, not only in admin UI flows. Manual, admin-triggered, and scheduled ingestion paths should all use the same source gating rules before any rows are fetched or written.

## Candidate Online Sources

Priority order:

- existing or expanded GCC official families such as `uae_fcsc_*`, `oman_*`, `qatar_*`, `bahrain_*`, `kuwait_*`, and `saudi_*`
- vetted international or regional proxy families already represented in the source registry, such as `worldbank_gcc` and `wb_gcc_*`
- highly controlled fallback proxy sources such as `bls_oes_usa`, only when they are explicitly classified as proxy support and do not override stronger GCC exact data

Out of scope for this design:

- unreviewed scraping of random salary websites
- bypassing source approval to gain coverage quickly
- replacing official data with global proxy data where official exact coverage already exists

## Testing Strategy

- Add unit tests for refresh-path error handling so failed delete or insert operations throw.
- Add unit tests for transactional or staging-and-swap refresh behavior so partial failures do not leave live platform tables empty.
- Add unit tests for any new source-tier helpers or reporting summaries.
- Add precedence tests for official and proxy collisions on the same exact cohort.
- Add segmented-cohort tests covering `industry`, `company_size`, and blended support behavior.
- Add tests for row-level source-tier propagation into both `platform_market_benchmarks` and `public_benchmark_snapshots`.
- Add tests confirming server-side ingestion rejects unapproved or review-blocked sources even when invoked outside the UI.
- Extend admin seed and publish route tests to verify official and proxy coverage summaries.
- Extend admin publish page tests to render the new coverage breakdown clearly.
- Re-run targeted coverage, seed, publish, and admin client tests after implementation.

## Acceptance Criteria

- New approved online sources can be ingested through the current adapter and worker flow without bypassing normalization or DQ.
- `refreshPlatformMarketPool()` uses a non-destructive refresh strategy so failed refreshes do not clear live tenant-visible platform rows.
- `refreshPlatformMarketPool()` throws when platform pool or snapshot writes fail.
- Admin coverage surfaces show a clear split between official exact coverage and total published exact coverage.
- Tenant-facing market reads still come from the platform pool and do not regress into workspace-only behavior.
- Proxy-backed rows can fill exact gaps, but official exact rows remain preferred when both exist.
- Rows from blocked or no-longer-approved sources stop contributing to newly published platform rows on the next refresh.
