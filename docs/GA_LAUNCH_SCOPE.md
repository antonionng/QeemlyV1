# Qeemly GA Launch Scope

This file defines the feature freeze boundary for the current launch.

## GA Workflows (must remain stable)

- Authentication (`/login`, `/register`)
- Company setup and settings (`/dashboard/settings`)
- Team management (`/dashboard/team`)
- Data upload (`/dashboard/upload`)
- Company overview (`/dashboard/overview`)
- Benchmarking (`/dashboard/benchmarks`)
- Salary review (`/dashboard/salary-review`)
- Reports and compliance (`/dashboard/reports`, `/dashboard/compliance`)
- Integrations (`/dashboard/integrations`)

## Deferred From GA

- Billing and subscriptions (`/dashboard/billing`)
- Non-essential admin extras

## Feature Freeze Rule

- Only bug fixes, security hardening, UX polish, and reliability work can be merged until launch.
- New product features are deferred unless they unblock a GA workflow above.
