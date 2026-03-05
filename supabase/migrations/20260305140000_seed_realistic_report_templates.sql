-- Seed realistic default report templates used by production customers.
-- These templates are global (workspace_id = NULL) and available to all workspaces.

INSERT INTO report_templates (
  workspace_id, slug, title, type_id, category, description, cadence, coverage,
  confidence, owner, tags, config, is_active, version
)
SELECT
  NULL,
  'exec-comp-health-monthly',
  'UAE Executive Compensation Health (Monthly)',
  'overview',
  'leadership',
  'CHRO and CFO monthly pack covering compensation spend, hiring pressure, and policy risk across UAE and GCC teams.',
  'Monthly',
  'UAE and GCC business units',
  'High',
  'People Analytics',
  ARRAY['Board', 'CHRO', 'CFO', 'Budget', 'Risk'],
  '{
    "data_dependencies": ["reports", "profiles", "workspace_billing_subscriptions", "billing_invoices"],
    "sections": ["headline_kpis", "budget_variance", "hiring_pressure", "top_risks"],
    "metrics": ["active_headcount", "comp_spend", "cost_per_hire", "offer_acceptance_rate"]
  }'::jsonb,
  true,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM report_templates WHERE workspace_id IS NULL AND slug = 'exec-comp-health-monthly' AND version = 1
);

INSERT INTO report_templates (
  workspace_id, slug, title, type_id, category, description, cadence, coverage,
  confidence, owner, tags, config, is_active, version
)
SELECT
  NULL,
  'comp-cycle-ops-weekly',
  'Compensation Cycle Operations (Weekly)',
  'overview',
  'operations',
  'Operations view of approvals, turnaround times, and exception rates during merit and promotion cycles.',
  'Weekly',
  'All active UAE and GCC cycles',
  'High',
  'Comp Ops',
  ARRAY['Approvals', 'SLA', 'Exceptions'],
  '{
    "data_dependencies": ["reports", "report_runs"],
    "sections": ["cycle_throughput", "approval_sla", "exception_backlog"],
    "metrics": ["reports_generated", "median_turnaround_hours", "exception_rate"]
  }'::jsonb,
  true,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM report_templates WHERE workspace_id IS NULL AND slug = 'comp-cycle-ops-weekly' AND version = 1
);

INSERT INTO report_templates (
  workspace_id, slug, title, type_id, category, description, cadence, coverage,
  confidence, owner, tags, config, is_active, version
)
SELECT
  NULL,
  'role-market-benchmark-quarterly',
  'GCC Role Market Benchmark (Quarterly)',
  'benchmark',
  'market',
  'Quarterly role benchmark versus GCC market percentiles (P25/P50/P75) with movement tracking.',
  'Quarterly',
  'Critical role families in UAE, KSA, and Qatar',
  'High',
  'Total Rewards',
  ARRAY['Market', 'GCC', 'Roles', 'Percentiles'],
  '{
    "data_dependencies": ["public_benchmark_snapshots"],
    "sections": ["role_percentiles", "market_movement", "outlier_roles"],
    "metrics": ["p50_gap_pct", "p75_gap_pct", "mom_delta_p50"]
  }'::jsonb,
  true,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM report_templates WHERE workspace_id IS NULL AND slug = 'role-market-benchmark-quarterly' AND version = 1
);

INSERT INTO report_templates (
  workspace_id, slug, title, type_id, category, description, cadence, coverage,
  confidence, owner, tags, config, is_active, version
)
SELECT
  NULL,
  'geo-pay-positioning-quarterly',
  'Geo Pay Positioning - GCC Hubs (Quarterly)',
  'benchmark',
  'market',
  'Location-based pay competitiveness and cost-of-living pressure across Dubai, Abu Dhabi, Riyadh, Doha, and Manama.',
  'Quarterly',
  'Priority GCC hiring cities',
  'Medium',
  'Talent Strategy',
  ARRAY['Geo', 'COL', 'Pay Positioning'],
  '{
    "data_dependencies": ["public_benchmark_snapshots", "relocation_city_costs"],
    "sections": ["geo_comparison", "col_pressure", "pay_adjustment_candidates"],
    "metrics": ["geo_gap_pct", "col_index", "hiring_competitiveness_score"]
  }'::jsonb,
  true,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM report_templates WHERE workspace_id IS NULL AND slug = 'geo-pay-positioning-quarterly' AND version = 1
);

INSERT INTO report_templates (
  workspace_id, slug, title, type_id, category, description, cadence, coverage,
  confidence, owner, tags, config, is_active, version
)
SELECT
  NULL,
  'pay-equity-and-fairness-monthly',
  'Pay Equity & Fairness (Monthly)',
  'compliance',
  'equity',
  'Monitors pay equity gaps by level and function with remediation priorities for HRBP and compliance teams.',
  'Monthly',
  'All employees',
  'High',
  'Compliance',
  ARRAY['Equity', 'Audit', 'Remediation'],
  '{
    "data_dependencies": ["compliance_snapshots"],
    "sections": ["equity_gaps", "variance_analysis", "remediation_plan"],
    "metrics": ["median_gap_pct", "high_risk_roles", "time_to_remediate_days"]
  }'::jsonb,
  true,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM report_templates WHERE workspace_id IS NULL AND slug = 'pay-equity-and-fairness-monthly' AND version = 1
);

INSERT INTO report_templates (
  workspace_id, slug, title, type_id, category, description, cadence, coverage,
  confidence, owner, tags, config, is_active, version
)
SELECT
  NULL,
  'offer-policy-compliance-weekly',
  'Offer Policy Compliance (Weekly)',
  'compliance',
  'policy',
  'Weekly controls report for out-of-band offers, approval exceptions, and policy adherence risk.',
  'Weekly',
  'All new offers',
  'High',
  'People Operations',
  ARRAY['Offers', 'Policy', 'Controls'],
  '{
    "data_dependencies": ["compliance_snapshots", "reports"],
    "sections": ["exceptions_log", "approval_controls", "policy_risk_trend"],
    "metrics": ["exception_count", "exception_rate", "approval_breach_count"]
  }'::jsonb,
  true,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM report_templates WHERE workspace_id IS NULL AND slug = 'offer-policy-compliance-weekly' AND version = 1
);

INSERT INTO report_templates (
  workspace_id, slug, title, type_id, category, description, cadence, coverage,
  confidence, owner, tags, config, is_active, version
)
SELECT
  NULL,
  'comp-planning-scenarios-ondemand',
  'Compensation Planning Scenarios (On Demand)',
  'custom',
  'planning',
  'Scenario planner for headcount growth, merit budgets, and compensation mix decisions for finance and people leads.',
  'On Demand',
  'Selected business units',
  'Medium',
  'Strategic HR',
  ARRAY['Scenario', 'Planning', 'Budget'],
  '{
    "data_dependencies": ["reports", "billing_invoices", "workspace_billing_subscriptions"],
    "sections": ["scenario_inputs", "budget_projection", "tradeoff_analysis"],
    "metrics": ["projected_comp_spend", "budget_delta_pct", "runway_months"]
  }'::jsonb,
  true,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM report_templates WHERE workspace_id IS NULL AND slug = 'comp-planning-scenarios-ondemand' AND version = 1
);

INSERT INTO report_templates (
  workspace_id, slug, title, type_id, category, description, cadence, coverage,
  confidence, owner, tags, config, is_active, version
)
SELECT
  NULL,
  'quarterly-board-pack-custom',
  'Quarterly Board Pack (Custom)',
  'custom',
  'leadership',
  'Configurable executive pack combining market movement, compliance posture, and cost narrative for board reviews.',
  'Quarterly',
  'Executive audience',
  'High',
  'People Analytics',
  ARRAY['Board', 'Narrative', 'Quarterly'],
  '{
    "data_dependencies": ["public_benchmark_snapshots", "compliance_snapshots", "billing_invoices"],
    "sections": ["market_story", "compliance_story", "cost_story", "decisions_needed"],
    "metrics": ["market_gap_pct", "compliance_score", "spend_trend_pct"]
  }'::jsonb,
  true,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM report_templates WHERE workspace_id IS NULL AND slug = 'quarterly-board-pack-custom' AND version = 1
);

INSERT INTO report_templates (
  workspace_id, slug, title, type_id, category, description, cadence, coverage,
  confidence, owner, tags, config, is_active, version
)
SELECT
  NULL,
  'fintech-reward-risk-watch-monthly',
  'Fintech Reward Risk Watch (Monthly)',
  'benchmark',
  'industry-fintech',
  'Tracks pay competitiveness and retention risk for product, engineering, and risk functions in fintech teams.',
  'Monthly',
  'Fintech critical roles',
  'High',
  'Total Rewards',
  ARRAY['Fintech', 'Retention', 'Engineering', 'Risk'],
  '{
    "data_dependencies": ["public_benchmark_snapshots", "reports"],
    "sections": ["role_heatmap", "retention_risk", "offer_pressure"],
    "metrics": ["market_gap_pct", "offer_decline_rate", "high_risk_role_count"]
  }'::jsonb,
  true,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM report_templates WHERE workspace_id IS NULL AND slug = 'fintech-reward-risk-watch-monthly' AND version = 1
);

INSERT INTO report_templates (
  workspace_id, slug, title, type_id, category, description, cadence, coverage,
  confidence, owner, tags, config, is_active, version
)
SELECT
  NULL,
  'healthcare-compliance-and-staffing-monthly',
  'Healthcare Compliance & Staffing (Monthly)',
  'compliance',
  'industry-healthcare',
  'Combines staffing pressure, overtime risk, and policy controls for hospital and clinic operations.',
  'Monthly',
  'Clinical and non-clinical roles',
  'High',
  'People Operations',
  ARRAY['Healthcare', 'Compliance', 'Staffing', 'Overtime'],
  '{
    "data_dependencies": ["compliance_snapshots", "reports"],
    "sections": ["staffing_pressure", "control_exceptions", "audit_readiness"],
    "metrics": ["policy_exception_rate", "overtime_pressure_index", "audit_open_items"]
  }'::jsonb,
  true,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM report_templates WHERE workspace_id IS NULL AND slug = 'healthcare-compliance-and-staffing-monthly' AND version = 1
);

INSERT INTO report_templates (
  workspace_id, slug, title, type_id, category, description, cadence, coverage,
  confidence, owner, tags, config, is_active, version
)
SELECT
  NULL,
  'retail-workforce-cost-and-turnover-weekly',
  'Retail Workforce Cost & Turnover (Weekly)',
  'overview',
  'industry-retail',
  'Weekly store and region view of labor cost, turnover signals, and hiring gaps for retail operations.',
  'Weekly',
  'Store and frontline workforce',
  'Medium',
  'HR Operations',
  ARRAY['Retail', 'Turnover', 'Labor Cost', 'Frontline'],
  '{
    "data_dependencies": ["reports", "billing_invoices"],
    "sections": ["labor_cost_trend", "turnover_signals", "hiring_gap_summary"],
    "metrics": ["labor_cost_per_store", "frontline_turnover_pct", "vacancy_fill_days"]
  }'::jsonb,
  true,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM report_templates WHERE workspace_id IS NULL AND slug = 'retail-workforce-cost-and-turnover-weekly' AND version = 1
);
