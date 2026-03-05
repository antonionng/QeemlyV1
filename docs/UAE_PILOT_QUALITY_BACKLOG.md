# UAE Pilot Quality Backlog (Launch-Critical)

Last updated: 2026-03-05

## Scope

This backlog is the launch-critical triage for the UAE pilot branch, based on fresh `lint`, `typecheck`, and `build` runs.

## P0 (must close before client onboarding)

1. **Lint errors in workflow-critical paths** - **Closed**
   - `web/components/dashboard/salary-review/review-table.tsx` (`react-hooks/static-components`)
   - `web/components/dashboard/reports/template-library-modal.tsx` (`react-hooks/set-state-in-effect`)
   - `web/components/dashboard/upload/*` (`@typescript-eslint/no-explicit-any`)
   - Impact: user-facing salary review, reporting, and upload stability.

2. **Workflow lint errors in app routes** - **Closed**
   - `web/app/(dashboard)/dashboard/settings/employees/page.tsx` (`react-hooks/set-state-in-effect`)
   - `web/app/login/page.tsx` (`react/no-unescaped-entities`)
   - Impact: onboarding/setup and auth trust.

3. **Build gate depends on lint gate** - **Closed**
   - `npm run build` now compiles and type-checks, but release gate is still blocked by lint errors.
   - Impact: cannot mark CI required for pilot readiness until lint passes.

## P1 (should close during pilot window)

1. **Dashboard/admin effect hygiene**
   - Multiple admin pages with `react-hooks/set-state-in-effect` errors.
   - Lower client impact for pilot users, but increases operational noise.

2. **Unescaped entities / no-explicit-any cleanup**
   - Scattered across non-core components.
   - Improves maintainability and review speed.

## P2 (post-first-client hardening)

1. **Unused-variable warning cleanup**
   - High warning volume, mostly non-blocking.
   - Useful to improve signal-to-noise in CI output.

## Validation Snapshot

- `npm run validate:env`: **PASS**
- `npm run lint -- --quiet`: **PASS**
- `npm run typecheck`: **PASS**
- `npm run test`: **PASS**
- `npm run build`: **PASS**
- `npm run smoke:pilot`: **PASS**

## Ownership and Sequence

1. Fix salary review + upload + reporting lint errors.
2. Fix onboarding/auth lint errors.
3. Re-run `lint`, `typecheck`, `test`, `build`.
4. Update go/no-go decision document for client #1.
