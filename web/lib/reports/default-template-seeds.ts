import type { ReportTemplate } from "./types";

type TemplateType = ReportTemplate["type_id"];
type Confidence = ReportTemplate["confidence"];

export type ReportTemplateSeed = {
  slug: string;
  title: string;
  type_id: TemplateType;
  category: string;
  description: string;
  cadence: string;
  coverage: string;
  confidence: Confidence;
  owner: string;
  tags: string[];
  config: Record<string, unknown>;
  is_active: boolean;
  version: number;
};

export const DEFAULT_REPORT_TEMPLATE_SEEDS: ReportTemplateSeed[] = [
  {
    slug: "exec-comp-health-monthly",
    title: "UAE Executive Compensation Health (Monthly)",
    type_id: "overview",
    category: "leadership",
    description:
      "CHRO and CFO monthly pack covering compensation spend, hiring pressure, and policy risk across UAE and GCC teams.",
    cadence: "Monthly",
    coverage: "UAE and GCC business units",
    confidence: "High",
    owner: "People Analytics",
    tags: ["Board", "CHRO", "CFO", "Budget", "Risk"],
    config: {
      data_dependencies: [
        "reports",
        "profiles",
        "workspace_billing_subscriptions",
        "billing_invoices",
      ],
      sections: ["headline_kpis", "budget_variance", "hiring_pressure", "top_risks"],
      metrics: ["active_headcount", "comp_spend", "cost_per_hire", "offer_acceptance_rate"],
    },
    is_active: true,
    version: 1,
  },
  {
    slug: "comp-cycle-ops-weekly",
    title: "Compensation Cycle Operations (Weekly)",
    type_id: "overview",
    category: "operations",
    description:
      "Operations view of approvals, turnaround times, and exception rates during merit and promotion cycles.",
    cadence: "Weekly",
    coverage: "All active UAE and GCC cycles",
    confidence: "High",
    owner: "Comp Ops",
    tags: ["Approvals", "SLA", "Exceptions"],
    config: {
      data_dependencies: ["reports", "report_runs"],
      sections: ["cycle_throughput", "approval_sla", "exception_backlog"],
      metrics: ["reports_generated", "median_turnaround_hours", "exception_rate"],
    },
    is_active: true,
    version: 1,
  },
  {
    slug: "role-market-benchmark-quarterly",
    title: "GCC Role Market Benchmark (Quarterly)",
    type_id: "benchmark",
    category: "market",
    description:
      "Quarterly role benchmark versus GCC market percentiles (P25/P50/P75) with movement tracking.",
    cadence: "Quarterly",
    coverage: "Critical role families in UAE, KSA, and Qatar",
    confidence: "High",
    owner: "Total Rewards",
    tags: ["Market", "GCC", "Roles", "Percentiles"],
    config: {
      data_dependencies: ["public_benchmark_snapshots"],
      sections: ["role_percentiles", "market_movement", "outlier_roles"],
      metrics: ["p50_gap_pct", "p75_gap_pct", "mom_delta_p50"],
    },
    is_active: true,
    version: 1,
  },
  {
    slug: "geo-pay-positioning-quarterly",
    title: "Geo Pay Positioning - GCC Hubs (Quarterly)",
    type_id: "benchmark",
    category: "market",
    description:
      "Location-based pay competitiveness and cost-of-living pressure across Dubai, Abu Dhabi, Riyadh, Doha, and Manama.",
    cadence: "Quarterly",
    coverage: "Priority GCC hiring cities",
    confidence: "Medium",
    owner: "Talent Strategy",
    tags: ["Geo", "COL", "Pay Positioning"],
    config: {
      data_dependencies: ["public_benchmark_snapshots", "relocation_city_costs"],
      sections: ["geo_comparison", "col_pressure", "pay_adjustment_candidates"],
      metrics: ["geo_gap_pct", "col_index", "hiring_competitiveness_score"],
    },
    is_active: true,
    version: 1,
  },
  {
    slug: "pay-equity-and-fairness-monthly",
    title: "Pay Equity & Fairness (Monthly)",
    type_id: "compliance",
    category: "equity",
    description:
      "Monitors pay equity gaps by level and function with remediation priorities for HRBP and compliance teams.",
    cadence: "Monthly",
    coverage: "All employees",
    confidence: "High",
    owner: "Compliance",
    tags: ["Equity", "Audit", "Remediation"],
    config: {
      data_dependencies: ["compliance_snapshots"],
      sections: ["equity_gaps", "variance_analysis", "remediation_plan"],
      metrics: ["median_gap_pct", "high_risk_roles", "time_to_remediate_days"],
    },
    is_active: true,
    version: 1,
  },
  {
    slug: "offer-policy-compliance-weekly",
    title: "Offer Policy Compliance (Weekly)",
    type_id: "compliance",
    category: "policy",
    description:
      "Weekly controls report for out-of-band offers, approval exceptions, and policy adherence risk.",
    cadence: "Weekly",
    coverage: "All new offers",
    confidence: "High",
    owner: "People Operations",
    tags: ["Offers", "Policy", "Controls"],
    config: {
      data_dependencies: ["compliance_snapshots", "reports"],
      sections: ["exceptions_log", "approval_controls", "policy_risk_trend"],
      metrics: ["exception_count", "exception_rate", "approval_breach_count"],
    },
    is_active: true,
    version: 1,
  },
  {
    slug: "comp-planning-scenarios-ondemand",
    title: "Compensation Planning Scenarios (On Demand)",
    type_id: "custom",
    category: "planning",
    description:
      "Scenario planner for headcount growth, merit budgets, and compensation mix decisions for finance and people leads.",
    cadence: "On Demand",
    coverage: "Selected business units",
    confidence: "Medium",
    owner: "Strategic HR",
    tags: ["Scenario", "Planning", "Budget"],
    config: {
      data_dependencies: ["reports", "billing_invoices", "workspace_billing_subscriptions"],
      sections: ["scenario_inputs", "budget_projection", "tradeoff_analysis"],
      metrics: ["projected_comp_spend", "budget_delta_pct", "runway_months"],
    },
    is_active: true,
    version: 1,
  },
  {
    slug: "quarterly-board-pack-custom",
    title: "Quarterly Board Pack (Custom)",
    type_id: "custom",
    category: "leadership",
    description:
      "Configurable executive pack combining market movement, compliance posture, and cost narrative for board reviews.",
    cadence: "Quarterly",
    coverage: "Executive audience",
    confidence: "High",
    owner: "People Analytics",
    tags: ["Board", "Narrative", "Quarterly"],
    config: {
      data_dependencies: [
        "public_benchmark_snapshots",
        "compliance_snapshots",
        "billing_invoices",
      ],
      sections: ["market_story", "compliance_story", "cost_story", "decisions_needed"],
      metrics: ["market_gap_pct", "compliance_score", "spend_trend_pct"],
    },
    is_active: true,
    version: 1,
  },
  {
    slug: "fintech-reward-risk-watch-monthly",
    title: "Fintech Reward Risk Watch (Monthly)",
    type_id: "benchmark",
    category: "industry-fintech",
    description:
      "Tracks pay competitiveness and retention risk for product, engineering, and risk functions in fintech teams.",
    cadence: "Monthly",
    coverage: "Fintech critical roles",
    confidence: "High",
    owner: "Total Rewards",
    tags: ["Fintech", "Retention", "Engineering", "Risk"],
    config: {
      data_dependencies: ["public_benchmark_snapshots", "reports"],
      sections: ["role_heatmap", "retention_risk", "offer_pressure"],
      metrics: ["market_gap_pct", "offer_decline_rate", "high_risk_role_count"],
    },
    is_active: true,
    version: 1,
  },
  {
    slug: "healthcare-compliance-and-staffing-monthly",
    title: "Healthcare Compliance & Staffing (Monthly)",
    type_id: "compliance",
    category: "industry-healthcare",
    description:
      "Combines staffing pressure, overtime risk, and policy controls for hospital and clinic operations.",
    cadence: "Monthly",
    coverage: "Clinical and non-clinical roles",
    confidence: "High",
    owner: "People Operations",
    tags: ["Healthcare", "Compliance", "Staffing", "Overtime"],
    config: {
      data_dependencies: ["compliance_snapshots", "reports"],
      sections: ["staffing_pressure", "control_exceptions", "audit_readiness"],
      metrics: ["policy_exception_rate", "overtime_pressure_index", "audit_open_items"],
    },
    is_active: true,
    version: 1,
  },
  {
    slug: "retail-workforce-cost-and-turnover-weekly",
    title: "Retail Workforce Cost & Turnover (Weekly)",
    type_id: "overview",
    category: "industry-retail",
    description:
      "Weekly store and region view of labor cost, turnover signals, and hiring gaps for retail operations.",
    cadence: "Weekly",
    coverage: "Store and frontline workforce",
    confidence: "Medium",
    owner: "HR Operations",
    tags: ["Retail", "Turnover", "Labor Cost", "Frontline"],
    config: {
      data_dependencies: ["reports", "billing_invoices"],
      sections: ["labor_cost_trend", "turnover_signals", "hiring_gap_summary"],
      metrics: ["labor_cost_per_store", "frontline_turnover_pct", "vacancy_fill_days"],
    },
    is_active: true,
    version: 1,
  },
];
