# Qeemly Release Runbook

## 1) Pre-release checks

Run from `web/`:

- `npm run validate:env`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## 2) Security checks

- Confirm API key auth validates full key hash in `web/app/api/v1/middleware.ts`.
- Confirm cron endpoint requires `CRON_SECRET` in `web/app/api/cron/ingestion/route.ts`.
- Confirm webhook signatures are validated in `web/app/api/integrations/webhook/route.ts`.
- Confirm no plaintext credentials remain in seed files.

## 3) Smoke tests (critical workflows)

- Auth: sign up, sign in, sign out.
- Setup: workspace settings save successfully.
- Team: invite, resend, cancel invitation.
- Data: upload employees + benchmark data, verify dashboard stats update.
- Analysis: benchmark search and salary review render with uploaded data.
- Automated smoke command: `npm run smoke:pilot`
- Daily cadence: run once every morning on pilot branch and log outcome.

## 4) Observability and operations

- Monitor server errors for:
  - contact form persistence failures (`/api/contact`)
  - cron ingestion failures (`/api/cron/ingestion`)
  - webhook auth failures (`/api/integrations/webhook`)
- Verify cron runs and ingestion jobs are being created/processed.

## 5) Rollback

- Re-deploy last known-good build.
- Restore previous environment variable set if a config change caused failure.
- If schema changes were applied, run the matching rollback SQL or restore from backup snapshot.
- If a pilot client is impacted, switch account to read-only support mode while rollback runs.

## 5b) Incident response (pilot)

- Severity model:
  - Sev-1: incorrect compensation output shown to client or unavailable core workflow.
  - Sev-2: workflow degraded but workaround exists.
  - Sev-3: cosmetic or non-blocking quality issue.
- Response targets:
  - Sev-1 acknowledge in 15 minutes, mitigation in 60 minutes.
  - Sev-2 acknowledge in 60 minutes, mitigation in same business day.
- Incident template:
  - Trigger time
  - Impacted workflows/clients
  - Suspected root cause
  - Mitigation
  - Rollback decision
  - Follow-up action owner/date

## 6) Post-release verification

- Re-run smoke tests on production.
- Verify no spike in 4xx/5xx responses on API endpoints.
- Confirm no pending P0 launch issues remain open.
