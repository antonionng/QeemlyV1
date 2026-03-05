# Qeemly Data Repo Inventory

Canonical tables, UI entry points, and entity definitions for the data pipeline and normalization layer.

## 1. Canonical Tables (Supabase)

### Data tables (primary ingestion targets)

| Table | Purpose | Key columns | Unique / lookup keys |
|-------|---------|-------------|----------------------|
| `employees` | Employee records (workspace-scoped) | workspace_id, role_id, level_id, location_id, base_salary, bonus, equity | workspace_id + email (or external_id when added) |
| `salary_benchmarks` | Market benchmark percentiles | workspace_id, role_id, location_id, level_id, p10–p90, source, confidence | UNIQUE(workspace_id, role_id, location_id, level_id, valid_from) |
| `compensation_history` | Salary change timeline | employee_id, effective_date, base_salary, bonus, equity | employee_id + effective_date |
| `workspace_settings` | Company defaults | workspace_id, default_currency, target_percentile | workspace_id (1:1) |

### Supporting / audit tables

| Table | Purpose |
|-------|---------|
| `data_uploads` | Audit trail for CSV/Excel imports |
| `integrations` | Connected HRIS/ATS/notification providers |
| `integration_sync_logs` | Sync run audit (records created/updated/failed) |
| `workspaces`, `profiles`, `team_invitations` | Multi-tenancy + auth |

## 2. Canonical Entity IDs (taxonomy)

Used for normalization from external sources. Defined in `web/lib/dashboard/dummy-data.ts`.

### Roles (`role_id`)

| id | title |
|----|-------|
| swe, swe-fe, swe-be, swe-mobile, swe-devops, swe-data, swe-ml | Engineering |
| pm, tpm | Product |
| designer, ux-researcher | Design |
| data-scientist, data-analyst | Data |
| security, qa | Engineering |

### Levels (`level_id`)

| id | name | category |
|----|------|----------|
| ic1–ic5 | Junior → Principal | IC |
| m1, m2 | Manager, Senior Manager | Manager |
| d1, d2, vp | Director → VP | Executive |

### Locations (`location_id`)

| id | city | country | currency |
|----|------|---------|----------|
| dubai, abu-dhabi | UAE | AE | AED |
| riyadh, jeddah | Saudi Arabia | SA | SAR |
| doha | Qatar | QA | QAR |
| manama | Bahrain | BH | BHD |
| kuwait-city | Kuwait | KW | KWD |
| muscat | Oman | OM | OMR |

Extended locations (UK, etc.) in `web/lib/benchmarks/benchmark-state.ts` (`EXTENDED_LOCATIONS`).

## 3. Currency Normalization

- **Location → currency**: Each location has a canonical currency (e.g. dubai → AED). See `LOCATIONS[].currency` and `getCurrencyForLocation()` in `web/lib/upload/transformers.ts`.
- **Benchmark storage**: Store original currency; normalize for cross-location comparison using FX rates (to be wired in).
- **Default workspace currency**: `workspace_settings.default_currency` (e.g. GBP).

## 4. Time Validity (benchmarks)

- `salary_benchmarks.valid_from`, `valid_to`: Defines the period the benchmark applies to.
- `valid_from` required; `valid_to` nullable (interpreted as “current” when null).
- Unique constraint: `(workspace_id, role_id, location_id, level_id, valid_from)`.

## 5. UI Entry Points for Data

| Route | Data consumed | Components |
|-------|---------------|------------|
| `/dashboard/overview` | Company metrics, employees, bands | stat-cards, department tabs |
| `/dashboard/benchmarks` | salary_benchmarks, ROLES/LEVELS/LOCATIONS | benchmark-form, filter-sidebar, drilldown views |
| `/dashboard/upload` | CSV/Excel → employees, benchmarks | upload wizard, transformers |
| `/dashboard/integrations` | integrations, integration_sync_logs | provider cards, sync status |
| `/dashboard/settings` | workspace_settings | company profile, compensation defaults |
| `/dashboard/me` | employees (own), compensation_history | employee portal |
| `/dashboard/reports` | Aggregated metrics | report templates |

## 6. Source of Truth for Taxonomies

- **Runtime**: `web/lib/dashboard/dummy-data.ts` (ROLES, LEVELS, LOCATIONS)
- **Upload normalization**: `web/lib/upload/transformers.ts` (matchRole, matchLevel, matchLocation)
- **Future**: Move to DB-backed taxonomy tables (`roles`, `levels`, `locations`) with versioning for ingestion pipeline.
