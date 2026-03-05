# UAE Pilot Smoke and Incident Rehearsal Log

## 2026-03-05 Verification

### Commands run

- `npm run validate:env`
- `npm run lint -- --quiet`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run smoke:pilot`

### Outcome

- Validate env: **passed**
- Lint: **passed**
- Typecheck: **passed**
- Tests (unit + integration + e2e): **passed**
- Build: **passed**
- Smoke command: **passed**

### Notes

- Local smoke validation used an explicit shell override for `SUPABASE_SERVICE_ROLE_KEY` to satisfy required env checks.
- Deployment environments must provide the real key through managed secrets before production rollout.

## 2026-03-01 Rehearsal

### Commands run

- `npm run smoke:pilot`
- `npm run build`
- `npm run typecheck`

### Outcome

- Smoke command: **failed** at `validate:env` due missing env vars in current shell.
- Build: **passed**
- Typecheck: **passed**

### Incident rehearsal notes

- Simulated condition: missing runtime secrets
- Detection point: `validate:env` pre-check
- Mitigation path validated:
  1. Add missing secrets in deployment environment
  2. Re-run smoke command
  3. Proceed only after full green

### Rollback rehearsal checklist

- [x] Last-known-good redeploy path documented
- [x] Config rollback path documented
- [x] Data/schema rollback notes documented
- [ ] Dry-run executed in staging-like environment (pending)
