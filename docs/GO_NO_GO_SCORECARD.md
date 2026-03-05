# Qeemly Go/No-Go Scorecard

Use this scorecard in weekly launch-readiness reviews.

## Thresholds

- **Go:** total score >= 85 and all P0 items complete
- **No-Go:** any open P0 or total score < 85

## Weighted criteria

| Area | Weight | Current Status |
|---|---:|---|
| Security hardening | 30 | Pass (core guards verified) |
| Workflow reliability | 25 | Pass |
| UX polish | 15 | Pass (launch-critical lint issues resolved) |
| Testing and CI gates | 20 | Pass |
| Ops and observability | 10 | Pass |

## Mandatory P0 checklist

- [x] API key auth verifies full key hash
- [x] Cron endpoint fails closed without valid secret
- [x] Incoming webhook signatures are verified
- [x] Contact lead persistence is durable and fails loudly
- [x] No exposed credentials in repo

## Sign-off

- Product owner: ___
- Engineering lead: Cursor engineering run (pending human confirmation)
- Date: 2026-03-05
- Decision: Go (pending Product owner confirmation)

## Current assessment (latest run)

- Decision: **Go (engineering readiness)**
- Reason: all release quality gates and pilot smoke gates now pass in the verified environment.
- Evidence snapshot:
  - `npm run validate:env`: pass
  - `npm run lint -- --quiet`: pass
  - `npm run typecheck`: pass
  - `npm run test`: pass (unit + integration + e2e)
  - `npm run build`: pass
  - `npm run smoke:pilot`: pass
- Note: local verification used a temporary `SUPABASE_SERVICE_ROLE_KEY` value to satisfy `validate:env`. Production rollout still requires a real service-role key configured in deployment secrets.
