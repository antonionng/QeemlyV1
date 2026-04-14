import type {
  InternalOfferAiDraftRequest,
  RegeneratableField,
} from "./ai-draft";

// ---------------------------------------------------------------------------
// JSON schema enforced via OpenAI structured output
// ---------------------------------------------------------------------------

export const INTERNAL_OFFER_DRAFT_SCHEMA = {
  name: "internal_offer_draft",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      rationale: { type: "string" as const },
      band_position: {
        type: "string" as const,
        enum: ["below", "in-band", "above"],
      },
      negotiation_floor: { type: "number" as const },
      negotiation_ceiling: { type: "number" as const },
      risk_flags: {
        type: "array" as const,
        items: { type: "string" as const },
      },
      talking_points: {
        type: "array" as const,
        items: { type: "string" as const },
      },
      approval_notes: { type: "string" as const },
    },
    required: [
      "rationale",
      "band_position",
      "negotiation_floor",
      "negotiation_ceiling",
      "risk_flags",
      "talking_points",
      "approval_notes",
    ],
    additionalProperties: false,
  },
};

// Single-field schemas keyed by field name
const FIELD_SCHEMAS: Record<
  RegeneratableField,
  { name: string; strict: true; schema: Record<string, unknown> }
> = {
  rationale: {
    name: "internal_offer_rationale",
    strict: true,
    schema: {
      type: "object",
      properties: { rationale: { type: "string" } },
      required: ["rationale"],
      additionalProperties: false,
    },
  },
  risk_flags: {
    name: "internal_offer_risk_flags",
    strict: true,
    schema: {
      type: "object",
      properties: {
        risk_flags: { type: "array", items: { type: "string" } },
      },
      required: ["risk_flags"],
      additionalProperties: false,
    },
  },
  talking_points: {
    name: "internal_offer_talking_points",
    strict: true,
    schema: {
      type: "object",
      properties: {
        talking_points: { type: "array", items: { type: "string" } },
      },
      required: ["talking_points"],
      additionalProperties: false,
    },
  },
  approval_notes: {
    name: "internal_offer_approval_notes",
    strict: true,
    schema: {
      type: "object",
      properties: { approval_notes: { type: "string" } },
      required: ["approval_notes"],
      additionalProperties: false,
    },
  },
};

export function getSchemaForField(field?: RegeneratableField) {
  if (!field) return INTERNAL_OFFER_DRAFT_SCHEMA;
  return FIELD_SCHEMAS[field];
}

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

function bandPositionContext(req: InternalOfferAiDraftRequest): string {
  const p50 = Number(req.benchmark_percentiles["p50"] ?? 0);
  if (p50 <= 0) return "Benchmark p50 is unavailable.";

  const ratio = req.offer_value / p50;
  const label =
    ratio < 0.95 ? "below" : ratio > 1.05 ? "above" : "within";

  return (
    `The recommended offer is ${formatCurrency(req.offer_value, req.currency)} ` +
    `at P${req.target_percentile}. The market p50 is ${formatCurrency(p50, req.currency)} ` +
    `(ratio ${ratio.toFixed(2)}x), placing this offer ${label} the typical band.`
  );
}

function existingMetadataContext(req: InternalOfferAiDraftRequest): string {
  const meta = req.existing_metadata;
  if (!meta) return "";

  const parts: string[] = [];
  if (meta.rationale) parts.push(`Existing rationale: ${meta.rationale}`);
  if (meta.band_position)
    parts.push(`Current band position selection: ${meta.band_position}`);
  if (meta.risk_flags?.length)
    parts.push(`Current risk flags: ${meta.risk_flags.join("; ")}`);
  if (meta.talking_points?.length)
    parts.push(`Current talking points: ${meta.talking_points.join("; ")}`);
  if (meta.approval_notes)
    parts.push(`Current approval notes: ${meta.approval_notes}`);
  if (meta.negotiation_floor != null)
    parts.push(
      `Negotiation floor: ${formatCurrency(meta.negotiation_floor, req.currency)}`,
    );
  if (meta.negotiation_ceiling != null)
    parts.push(
      `Negotiation ceiling: ${formatCurrency(meta.negotiation_ceiling, req.currency)}`,
    );

  return parts.length > 0
    ? `\nExisting internal context (preserve intent where appropriate):\n${parts.join("\n")}`
    : "";
}

export function buildInternalOfferDraftPrompt(
  req: InternalOfferAiDraftRequest,
): string {
  const breakdownLine = req.package_breakdown
    ? `Package breakdown: Basic ${req.package_breakdown.basic_pct}%, Housing ${req.package_breakdown.housing_pct}%, Transport ${req.package_breakdown.transport_pct}%, Other ${req.package_breakdown.other_pct}%`
    : "";

  const regenInstruction = req.regenerate_field
    ? `\nYou are regenerating ONLY the "${req.regenerate_field}" field. Return only that field. Keep it aligned to the existing context below.`
    : "";

  return `You are Qeemly AI Advisory, acting as a senior compensation analyst drafting an internal offer brief.

Position: ${req.role_title}, ${req.level_name}
Location: ${req.location_city}, ${req.location_country}
Employment type: ${req.employment_type}
Currency: ${req.currency}
Target percentile: P${req.target_percentile}
Offer value: ${formatCurrency(req.offer_value, req.currency)}
Negotiation range: ${formatCurrency(req.offer_low, req.currency)} to ${formatCurrency(req.offer_high, req.currency)}
Benchmark source: ${req.benchmark_source}
${breakdownLine}

${bandPositionContext(req)}
${existingMetadataContext(req)}
${regenInstruction}

Instructions:
1. band_position: set to "below", "in-band", or "above" based on where the offer sits relative to the market band (p25-p75).
2. negotiation_floor: suggest a minimum acceptable total comp value in ${req.currency}. Should be at or slightly below the offer low.
3. negotiation_ceiling: suggest a maximum total comp value in ${req.currency}. Should be at or slightly above the offer high.
4. rationale: write 2-3 sentences explaining why this compensation level is appropriate. Reference market data, role context, and location cost factors. Be specific and executive-ready.
5. risk_flags: list 1-3 short risk considerations (e.g. competing offers, above-band positioning, thin market data). Each flag should be a single concise sentence.
6. talking_points: list 2-4 recruiter/manager talking points for the compensation discussion. Each point should be a concise sentence.
7. approval_notes: write 1-2 sentences of context for the approving manager or HR lead.

Keep language professional, specific, and free of filler. Do not use markdown formatting.`;
}

// ---------------------------------------------------------------------------
// Response normalization
// ---------------------------------------------------------------------------

export interface NormalizedDraft {
  rationale: string;
  band_position: "below" | "in-band" | "above";
  negotiation_floor: number;
  negotiation_ceiling: number;
  risk_flags: string[];
  talking_points: string[];
  approval_notes: string;
}

const VALID_BAND_POSITIONS = new Set(["below", "in-band", "above"]);

export function normalizeDraftResponse(
  raw: Record<string, unknown>,
  fallbackFloor: number,
  fallbackCeiling: number,
): NormalizedDraft {
  const rawBand = String(raw.band_position ?? "in-band").toLowerCase();
  const band_position = (
    VALID_BAND_POSITIONS.has(rawBand) ? rawBand : "in-band"
  ) as NormalizedDraft["band_position"];

  const negotiation_floor =
    typeof raw.negotiation_floor === "number" && raw.negotiation_floor > 0
      ? Math.round(raw.negotiation_floor)
      : fallbackFloor;

  const negotiation_ceiling =
    typeof raw.negotiation_ceiling === "number" && raw.negotiation_ceiling > 0
      ? Math.round(raw.negotiation_ceiling)
      : fallbackCeiling;

  const toStringArray = (val: unknown): string[] => {
    if (!Array.isArray(val)) return [];
    return val
      .map((v) => String(v ?? "").trim())
      .filter((s) => s.length > 0);
  };

  return {
    rationale: String(raw.rationale ?? "").trim(),
    band_position,
    negotiation_floor: Math.min(negotiation_floor, negotiation_ceiling),
    negotiation_ceiling: Math.max(negotiation_floor, negotiation_ceiling),
    risk_flags: toStringArray(raw.risk_flags),
    talking_points: toStringArray(raw.talking_points),
    approval_notes: String(raw.approval_notes ?? "").trim(),
  };
}
