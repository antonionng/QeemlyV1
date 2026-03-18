# Qeemly Frontend UI

Frontend-only implementation of the Qeemly marketing site and dashboard shell. Stack: Next.js (App Router) + TypeScript + Tailwind v4 with Poppins.

## Run locally

```bash
# from the repo root
npm run db:start

# then start the web app
npm install
npm run dev

# visit http://localhost:3000
```

## Admin prerequisites

The admin panel does not use mock data. It reads live data from the shared Supabase-backed admin API routes under `/api/admin/*`.

- `SUPABASE_SERVICE_ROLE_KEY` is required for most admin routes. If it is missing, the admin API will fail and the dashboard will now show an explicit configuration error instead of empty data.
- `QEEMLY_SUPERADMINS` must include the email address you use to sign in to `/admin/login`.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required for auth/session handling.
- `PLATFORM_WORKSPACE_ID` is required for shared market ingestion and shared market seeding.
- `npm run db:reset` is only safe against an isolated local database. Automatic demo seeding is disabled by default because `seed_user.sql` clears tenant runtime data.
- Use `POST /api/admin/market-seed` as the shared-market operator flow after migrations are applied and runtime env is configured.
- `/admin/freshness`, `/admin/snapshots`, and parts of `/admin` remain empty until ingestion has run at least once.

## Structure
- `app/(marketing)/*` - marketing pages (home, search, pricing, contact) plus root route.
- `app/(dashboard)/*` - dashboard shell with placeholder pages for benchmarks, reports, compliance, settings.
- `app/login`, `app/register` - auth placeholders for future Supabase auth.
- `components/ui` - shared primitives (button, badge, card, chip, input).
- `components/layout` - nav and footer; `components/dashboard` - sidebar.
- `lib/constants.ts` - mock data for tiles and chips.

## Branding
Primary purple palette with teal accent:
- brand: `#824ae1`, `#6a2ed3`, `#5523aa`, `#3f1c82`
- accent teal: `#2ec0aa`, `#16aa94`
- backgrounds: `#f7f6fb`, cards `#ffffff`, muted `#f1ecfb`

## Supabase handoff notes
- Auth: wire `/login` and `/register` to Supabase Auth (magic links/OTP). Button primitives are ready for client handlers.
- Data: replace mock data in `lib/constants.ts` and dashboard cards with Supabase RPC/queries for salary ranges, expat vs local diffs, and activity feeds.
- Routing: protected dashboard group lives under `/dashboard/*`; wrap `(dashboard)/layout.tsx` with Supabase session provider when backend is ready.
- Forms: contact and register forms are static; point submit handlers to Supabase edge functions or tables once available.

## Scripts
- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run start` - run production build
- `npm run lint` - lint with Next config

## Tenant verification runbook

Use this after reseeding and when validating superadmin tenant override behavior.

1. Sign in as a superadmin and select tenant A in workspace switcher.
2. Call `GET /api/compliance` and verify `diagnostics.workspace_id` matches selected tenant (in dev mode).
3. Call `POST /api/compliance/refresh` and verify the same `workspace_id` is returned.
4. Go to `/dashboard/overview` and confirm headcount differs when switching to tenant B.
5. Run these SQL checks in Supabase SQL editor for the selected tenant id:

```sql
select count(*) as active_employees
from employees
where workspace_id = '<workspace_id>' and status is distinct from 'inactive';

select count(*) as benchmark_rows
from salary_benchmarks
where workspace_id = '<workspace_id>';

select
  (select count(*) from compliance_policies where workspace_id = '<workspace_id>') as policies,
  (select count(*) from compliance_regulatory_updates where workspace_id = '<workspace_id>') as regulatory_updates,
  (select count(*) from compliance_deadlines where workspace_id = '<workspace_id>') as deadlines,
  (select count(*) from compliance_visa_cases where workspace_id = '<workspace_id>') as visa_cases,
  (select count(*) from compliance_documents where workspace_id = '<workspace_id>') as documents,
  (select count(*) from compliance_audit_events where workspace_id = '<workspace_id>') as audit_events;
```

If any count is zero unexpectedly, reseed and refresh compliance again for that tenant.
