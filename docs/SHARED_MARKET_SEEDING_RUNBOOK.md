# Shared Market Seeding Runbook

This runbook is for the shared Supabase database used by Qeemly market reads.

## What changed

- Automatic demo seeding from `seed_user.sql` is disabled in `supabase/config.toml`.
- Shared market reads now depend on real pooled observations only.
- Real source ingestion and market-pool republishing can be triggered through `POST /api/admin/market-seed`.
- When no `sourceSlugs` are supplied, the admin route ingests all approved commercial sources.

## Prerequisites

Runtime env for the app process:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PLATFORM_WORKSPACE_ID`

Operator prerequisites:

- signed in as a Qeemly superadmin
- app server running with the env above

## Ingest and publish

1. Apply migrations:

```bash
npm run db:push
```

2. Sign in as a superadmin.

3. Trigger approved source ingestion plus pool refresh from the browser console.
If you omit `sourceSlugs`, Qeemly will ingest every approved commercial source:

```js
await fetch("/api/admin/market-seed", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({}),
}).then((response) => response.json());
```

4. If you want to ingest a specific set of approved sources only:

```js
await fetch("/api/admin/market-seed", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sourceSlugs: [
      "uae_fcsc_workforce_comp",
      "uae_fcsc_gov_compensation",
      "qatar_wages",
      "oman_ncsi_wages",
      "bahrain_compensation",
      "saudi_gastat_labor",
      "kuwait_open_labor",
    ],
  }),
}).then((response) => response.json());
```

5. If you only need to republish the pool after real source rows already exist:

```js
await fetch("/api/admin/market-seed", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ skipIngestion: true }),
}).then((response) => response.json());
```

## Verification SQL

Run these in the Supabase SQL editor:

```sql
select count(*) as live_market_rows
from salary_benchmarks
where source = 'market'
  and market_origin = 'live_ingestion';

select count(*) as pooled_rows
from platform_market_benchmarks;

select market_source_slug, count(*) as rows
from salary_benchmarks
where source = 'market'
  and market_origin = 'live_ingestion'
group by market_source_slug
order by rows desc, market_source_slug asc;

select role_id, location_id, level_id, contributor_count, provenance, freshness_at
from platform_market_benchmarks
order by contributor_count desc, freshness_at desc
limit 20;

select
  count(*) as pooled_rows,
  count(distinct role_id) as role_coverage,
  count(distinct location_id) as location_coverage,
  count(distinct level_id) as level_coverage
from platform_market_benchmarks;
```

Expected signals:

- live market rows are non-zero
- pooled rows are non-zero
- contributor counts come from real sources or tenant contributions
- `selectedSourceSlugs` in the admin route response shows which real feeds were used
- `Market Overview` stops showing the zero-trusted-cohort warning for the covered areas

## Rollback

1. Remove real ingestion rows for a specific source if needed:

```sql
delete from salary_benchmarks
where source = 'market'
  and market_source_slug = 'qatar_wages';
```

2. Rebuild the canonical pool and public snapshots from the remaining real dataset:

```js
await fetch("/api/admin/market-seed", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ skipIngestion: true }),
}).then((response) => response.json());
```

That final republish step is the rollback for `platform_market_benchmarks` and `public_benchmark_snapshots`. Do not manually wipe those tables unless you intend to republish them immediately.
