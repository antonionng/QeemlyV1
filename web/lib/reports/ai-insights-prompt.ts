import type { AnalyticsPayload } from "./analytics";

// ---------------------------------------------------------------------------
// Analysis focus types
// ---------------------------------------------------------------------------

export type AnalysisFocus =
  | "compensation_health"
  | "benchmark_coverage"
  | "department_comparison"
  | "risk_assessment"
  | "executive_summary";

export const ANALYSIS_FOCUS_OPTIONS: Array<{
  id: AnalysisFocus;
  label: string;
  description: string;
}> = [
  {
    id: "compensation_health",
    label: "Compensation Health",
    description: "Overall pay competitiveness, total payroll, and market alignment.",
  },
  {
    id: "benchmark_coverage",
    label: "Benchmark Coverage",
    description: "How well your roles are matched to market data and where gaps exist.",
  },
  {
    id: "department_comparison",
    label: "Department Comparison",
    description: "Side-by-side analysis of departments by headcount, pay, and market position.",
  },
  {
    id: "risk_assessment",
    label: "Risk Assessment",
    description: "Retention risks, compliance gaps, and compensation outliers.",
  },
  {
    id: "executive_summary",
    label: "Executive Summary",
    description: "Board-ready overview of your compensation posture and key actions.",
  },
];

// ---------------------------------------------------------------------------
// JSON schema enforced via OpenAI structured output
// ---------------------------------------------------------------------------

export const ANALYTICS_INSIGHTS_SCHEMA = {
  name: "analytics_insights",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      executive_summary: { type: "string" as const },
      insights: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            category: {
              type: "string" as const,
              enum: ["trend", "risk", "action"],
            },
            title: { type: "string" as const },
            body: { type: "string" as const },
          },
          required: ["category", "title", "body"],
          additionalProperties: false,
        },
      },
      normalized_categories: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            raw: { type: "string" as const },
            canonical: { type: "string" as const },
          },
          required: ["raw", "canonical"],
          additionalProperties: false,
        },
      },
    },
    required: ["executive_summary", "insights", "normalized_categories"],
    additionalProperties: false,
  },
};

// ---------------------------------------------------------------------------
// Prompt construction
// ---------------------------------------------------------------------------

function formatCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
}

function getFocusInstruction(focus: AnalysisFocus): string {
  switch (focus) {
    case "compensation_health":
      return "Focus your analysis on overall compensation competitiveness: total payroll efficiency, market alignment across roles, and whether pay levels support talent retention and attraction. Highlight any systemic over- or under-payment patterns.";
    case "benchmark_coverage":
      return "Focus your analysis on benchmark data coverage: which departments and roles have strong market matching, where coverage gaps exist, data source quality, and what steps would improve overall coverage.";
    case "department_comparison":
      return "Focus your analysis on comparing departments against each other: relative pay levels, market positioning differences, headcount-to-cost ratios, and which departments may need compensation adjustments relative to peers.";
    case "risk_assessment":
      return "Focus your analysis on compensation risks: retention vulnerabilities from below-market pay, compliance exposure, departments with the widest market gaps, thin benchmark coverage areas, and any concentration risks.";
    case "executive_summary":
      return "Produce a board-ready executive summary: lead with the 2-3 most important findings, provide a clear status assessment (healthy/needs attention/critical), and end with prioritized recommended actions.";
  }
}

export function buildAnalyticsInsightsPrompt(
  payload: AnalyticsPayload,
  focus: AnalysisFocus = "executive_summary",
): string {
  const deptLines =
    payload.departments.length > 0
      ? payload.departments
          .slice(0, 10)
          .map(
            (d) =>
              `  - ${d.name}: ${d.headcount} employees, ${d.benchmarkedCount} benchmarked, avg vs market ${d.avgMarketComparison}%, total comp ${formatCurrency(d.totalComp, payload.currency)}`,
          )
          .join("\n")
      : "  (no department data available)";

  const sourceLines =
    payload.benchmarkSourceBreakdown.length > 0
      ? payload.benchmarkSourceBreakdown
          .map((s) => `  - ${s.source}: ${s.count} rows`)
          .join("\n")
      : "  (no benchmark sources available)";

  return `You are Qeemly AI Analytics, acting as a senior compensation analyst reviewing a workspace's compensation health.

Workspace Snapshot:
- Active employees: ${payload.activeEmployees}
- Benchmarked employees: ${payload.benchmarkedEmployees}
- Departments: ${payload.departmentCount}
- Currency: ${payload.currency}
- Total payroll: ${formatCurrency(payload.totalPayroll, payload.currency)}
- Average vs market: ${payload.avgMarketComparison}%
- Market data rows: ${payload.marketRowsCount}
- Market freshness: ${payload.marketFreshnessAt || "unknown"}
- Primary benchmark source: ${payload.benchmarkTrustLabel}
- Market-backed employees: ${payload.marketBackedEmployees}

Department Breakdown:
${deptLines}

Benchmark Source Breakdown:
${sourceLines}

Analysis Focus:
${getFocusInstruction(focus)}

Instructions:
1. executive_summary: Write 2-3 sentences summarizing the findings for the requested focus area. Reference key numbers. Be specific and executive-ready.
2. insights: Produce 3-6 insight objects, each with:
   - category: "trend" (data pattern), "risk" (concern or gap), or "action" (recommended next step)
   - title: a concise headline (5-10 words)
   - body: 1-2 sentences of specific, data-backed explanation
3. normalized_categories: If any department names or benchmark source labels are inconsistent or could be standardized, list each raw label and its canonical form. If everything looks clean, return an empty array.

Prioritize actionable insights relevant to the focus area. Reference specific numbers from the data above. Keep language professional and free of filler. Do not use markdown formatting.`;
}

// ---------------------------------------------------------------------------
// Response normalization
// ---------------------------------------------------------------------------

export type NormalizedInsightItem = {
  category: "trend" | "risk" | "action";
  title: string;
  body: string;
};

export type NormalizedInsightsResponse = {
  executive_summary: string;
  insights: NormalizedInsightItem[];
  normalized_categories: Array<{ raw: string; canonical: string }>;
};

const VALID_CATEGORIES = new Set(["trend", "risk", "action"]);

export function normalizeInsightsResponse(
  raw: Record<string, unknown>,
): NormalizedInsightsResponse {
  const executive_summary = String(raw.executive_summary ?? "").trim();

  const rawInsights = Array.isArray(raw.insights) ? raw.insights : [];
  const insights: NormalizedInsightItem[] = rawInsights
    .map((item: unknown) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const cat = String(obj.category ?? "trend").toLowerCase();
      return {
        category: (VALID_CATEGORIES.has(cat) ? cat : "trend") as
          | "trend"
          | "risk"
          | "action",
        title: String(obj.title ?? "").trim(),
        body: String(obj.body ?? "").trim(),
      };
    })
    .filter(
      (item): item is NormalizedInsightItem =>
        item !== null && item.title.length > 0 && item.body.length > 0,
    );

  const rawCategories = Array.isArray(raw.normalized_categories)
    ? raw.normalized_categories
    : [];
  const normalized_categories = rawCategories
    .map((entry: unknown) => {
      if (!entry || typeof entry !== "object") return null;
      const obj = entry as Record<string, unknown>;
      return {
        raw: String(obj.raw ?? "").trim(),
        canonical: String(obj.canonical ?? "").trim(),
      };
    })
    .filter(
      (
        entry,
      ): entry is { raw: string; canonical: string } =>
        entry !== null && entry.raw.length > 0 && entry.canonical.length > 0,
    );

  return { executive_summary, insights, normalized_categories };
}
