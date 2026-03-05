---
name: qeemly-benchmark-model
description: Enforces the platform-first benchmark data model across the Qeemly codebase. Use when building any feature that touches salary benchmarks, compensation data, employee positioning, market comparisons, AI chat context, compliance, or dashboard widgets that display benchmark information.
---

# Qeemly Benchmark Data Model

## Core Principle: The Data IS the Product

Qeemly's product is GCC compensation data, not the SaaS. The platform creates a data network effect: every tenant contributes anonymized data, every ingestion source enriches the pool, and the richer the pool the more valuable it is to every customer. This is the same model as Pave, Ravio, and Radford.

The SaaS (dashboards, AI sidekick, compliance, reports) is the delivery mechanism for this data.

## Three Data Layers

| Layer | Scope | Source | Table(s) | Always present? |
|-------|-------|--------|----------|-----------------|
| **Qeemly Market Data** | Platform-wide | Ingestion pipeline + aggregated tenant data | `public_benchmark_snapshots` (primary), `salary_benchmarks` where `source = 'market'` under `PLATFORM_WORKSPACE_ID` | YES — this is the product |
| **Employee Data** | Workspace | Tenant uploads/HRIS | `employees` | Yes (per tenant) |
| **Company Pay Bands** | Workspace | Tenant uploads their internal ranges | `salary_benchmarks` where `source = 'uploaded'` and `workspace_id = tenant` | Optional |

## How Comparisons Work

```
Employee Comp  ──►  vs Qeemly Market Data  ──►  Band Position / Market Ratio / Percentile
                         ▲
                         │ (optional overlay)
                    Company Pay Bands
```

- **Band position** = where the employee sits in the MARKET range (p10–p90)
- **Market comparison** = employee total comp vs market p50
- **Company band check** = optional, shows if employee is within their company's internal pay policy

## Rules for Every Feature

1. **NEVER query only workspace-scoped benchmarks.** The market data pool must always be accessible. Use `web/lib/benchmarks/platform-market.ts` to fetch market data.
2. **Market data is the primary benchmark.** Company-uploaded bands are supplementary.
3. **Tag the data source.** Every benchmark displayed in the UI must indicate whether it comes from "Market" or "Your Data" so users trust and understand the numbers.
4. **Employees always see market positioning.** Even if a tenant has zero uploaded benchmarks, their employees should see where they sit vs market.
5. **The `source` field matters:**
   - `market` = Qeemly platform data (ingested or aggregated)
   - `uploaded` = tenant's own pay bands
   - `survey` = survey-sourced data flowing through ingestion

## Key Files

| File | Role |
|------|------|
| `web/lib/benchmarks/platform-market.ts` | Shared accessor for platform market benchmarks |
| `web/lib/benchmarks/data-service.ts` | Client-side benchmark service (merges market + workspace) |
| `web/app/api/people/route.ts` | People API — returns market benchmarks + company bands |
| `web/lib/employees/data-service.ts` | `mapRowsToEmployees` — computes band/market positioning |
| `web/lib/ai/chat/general.ts` | General AI chat — injects market data into prompt |
| `web/lib/ai/chat/employee.ts` | Employee AI advisory — uses market benchmark as primary |
| `web/lib/employee.ts` | Employee self-service dashboard band positioning |
| `web/lib/compliance/snapshot-service.ts` | Compliance benchmark coverage |
| `web/lib/ingestion/worker.ts` | Writes market data to platform workspace |

## Anti-Patterns (Do NOT Do)

- Querying `salary_benchmarks` with only `.eq("workspace_id", tenantId)` and treating that as the full picture
- Showing "no benchmark data" when a tenant hasn't uploaded — market data should always be there
- Building a feature that only works when the tenant has uploaded benchmarks
- Treating platform market data as a "fallback" — it is the primary source
