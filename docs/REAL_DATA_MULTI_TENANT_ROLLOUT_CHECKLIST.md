# Real-Data Multi-Tenant Rollout Checklist

## Security and isolation
- [ ] Apply migration `supabase/migrations/20260301130000_harden_profiles_update_policy.sql` in all environments.
- [ ] Verify users cannot mutate `profiles.workspace_id` or `profiles.role` from client sessions.
- [x] Validate integration/webhook update/delete APIs reject cross-workspace IDs.
- [x] Verify OAuth callback rejects tampered/expired state and workspace mismatch.

## Mock and seed removal
- [x] Confirm `web/app/api/admin/seed/route.ts` is disabled (returns HTTP 410 in all environments).
- [x] Confirm `web/lib/seed/admin-seed.ts` and `web/lib/ingestion/adapters/sample-market.ts` are removed.
- [x] Confirm `supabase_seed_ingestion_sources.sql` is not used by release scripts.
- [ ] Confirm UI empty states appear when data is absent (not synthetic placeholders).

## Admin operations
- [ ] Create tenant from Admin `Tenants` page and verify workspace appears with slug.
- [ ] Invite user from Admin `Users` page and verify role/workspace assignment.
- [ ] Export tenant employees CSV from Admin `Tenants > [id]`.
- [ ] Validate Admin `Billing` page loads metrics from `/api/admin/billing`.
- [ ] Validate Admin `Benchmarks` filters load dynamic values from `/api/admin/benchmarks/meta`.

## Tenant data validation
- [ ] Seed real tenant data through integrations/uploads (not fixtures).
- [ ] Verify tenant A cannot read tenant B records across `/api/v1/*` endpoints.
- [ ] Verify admin override view still enforces explicit tenant selection and auditability.
- [ ] Verify dashboards and reports render “no data yet” for new tenants.

## Pre-release verification
- [x] Run `vitest` and ensure `tests/unit/security/tenant-isolation-guards.test.ts` passes.
- [x] Run lint/typecheck and resolve regressions.
- [x] Run critical smoke tests for admin + tenant workflows.
- [ ] Document known gaps and create tracked follow-ups before GA sign-off.
