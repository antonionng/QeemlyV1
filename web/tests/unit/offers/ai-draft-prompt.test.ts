import { describe, expect, it } from "vitest";
import {
  buildInternalOfferDraftPrompt,
  normalizeDraftResponse,
  getSchemaForField,
  INTERNAL_OFFER_DRAFT_SCHEMA,
} from "@/lib/offers/ai-draft-prompt";
import type { InternalOfferAiDraftRequest } from "@/lib/offers/ai-draft";

const BASE_REQUEST: InternalOfferAiDraftRequest = {
  role_title: "Software Engineer",
  level_name: "Senior (P3)",
  location_city: "Riyadh",
  location_country: "Saudi Arabia",
  employment_type: "national",
  currency: "SAR",
  target_percentile: 50,
  offer_value: 360000,
  offer_low: 345600,
  offer_high: 374400,
  benchmark_source: "market",
  benchmark_percentiles: { p25: 300000, p50: 350000, p75: 420000, p90: 480000 },
};

describe("buildInternalOfferDraftPrompt", () => {
  it("includes position details in the prompt", () => {
    const prompt = buildInternalOfferDraftPrompt(BASE_REQUEST);
    expect(prompt).toContain("Software Engineer");
    expect(prompt).toContain("Senior (P3)");
    expect(prompt).toContain("Riyadh");
    expect(prompt).toContain("Saudi Arabia");
    expect(prompt).toContain("P50");
  });

  it("includes benchmark context with market ratio", () => {
    const prompt = buildInternalOfferDraftPrompt(BASE_REQUEST);
    expect(prompt).toContain("market p50");
    expect(prompt).toContain("ratio");
  });

  it("includes package breakdown when provided", () => {
    const req: InternalOfferAiDraftRequest = {
      ...BASE_REQUEST,
      package_breakdown: {
        basic_pct: 60,
        housing_pct: 25,
        transport_pct: 10,
        other_pct: 5,
      },
    };
    const prompt = buildInternalOfferDraftPrompt(req);
    expect(prompt).toContain("Basic 60%");
    expect(prompt).toContain("Housing 25%");
  });

  it("includes regenerate instruction when field is specified", () => {
    const req: InternalOfferAiDraftRequest = {
      ...BASE_REQUEST,
      regenerate_field: "rationale",
      existing_metadata: {
        rationale: "Strong market position",
        band_position: "in-band",
      },
    };
    const prompt = buildInternalOfferDraftPrompt(req);
    expect(prompt).toContain('regenerating ONLY the "rationale" field');
    expect(prompt).toContain("Strong market position");
  });

  it("handles missing benchmark p50 gracefully", () => {
    const req: InternalOfferAiDraftRequest = {
      ...BASE_REQUEST,
      benchmark_percentiles: {},
    };
    const prompt = buildInternalOfferDraftPrompt(req);
    expect(prompt).toContain("p50 is unavailable");
  });
});

describe("normalizeDraftResponse", () => {
  it("normalizes a complete valid response", () => {
    const raw = {
      rationale: "  Strong market alignment.  ",
      band_position: "in-band",
      negotiation_floor: 345000,
      negotiation_ceiling: 375000,
      risk_flags: ["Competing offer", "Thin data"],
      talking_points: ["Equity comp", "Growth path"],
      approval_notes: "Standard approval.",
    };

    const result = normalizeDraftResponse(raw, 340000, 380000);

    expect(result.rationale).toBe("Strong market alignment.");
    expect(result.band_position).toBe("in-band");
    expect(result.negotiation_floor).toBe(345000);
    expect(result.negotiation_ceiling).toBe(375000);
    expect(result.risk_flags).toEqual(["Competing offer", "Thin data"]);
    expect(result.talking_points).toEqual(["Equity comp", "Growth path"]);
    expect(result.approval_notes).toBe("Standard approval.");
  });

  it("falls back to defaults for invalid band_position", () => {
    const raw = { band_position: "unknown", negotiation_floor: 100, negotiation_ceiling: 200 };
    const result = normalizeDraftResponse(raw, 100, 200);
    expect(result.band_position).toBe("in-band");
  });

  it("uses fallback values for missing or invalid negotiation bounds", () => {
    const raw = { negotiation_floor: -1, negotiation_ceiling: 0 };
    const result = normalizeDraftResponse(raw, 340000, 380000);
    expect(result.negotiation_floor).toBe(340000);
    expect(result.negotiation_ceiling).toBe(380000);
  });

  it("swaps floor and ceiling when floor > ceiling", () => {
    const raw = { negotiation_floor: 400000, negotiation_ceiling: 300000 };
    const result = normalizeDraftResponse(raw, 280000, 420000);
    expect(result.negotiation_floor).toBe(300000);
    expect(result.negotiation_ceiling).toBe(400000);
  });

  it("filters empty strings from arrays", () => {
    const raw = {
      risk_flags: ["Valid", "", "  ", "Also valid"],
      talking_points: ["", null, "Point"],
    };
    const result = normalizeDraftResponse(raw, 100, 200);
    expect(result.risk_flags).toEqual(["Valid", "Also valid"]);
    expect(result.talking_points).toEqual(["Point"]);
  });

  it("handles missing fields by defaulting to empty strings/arrays", () => {
    const result = normalizeDraftResponse({}, 100, 200);
    expect(result.rationale).toBe("");
    expect(result.risk_flags).toEqual([]);
    expect(result.talking_points).toEqual([]);
    expect(result.approval_notes).toBe("");
  });
});

describe("getSchemaForField", () => {
  it("returns full schema when no field specified", () => {
    expect(getSchemaForField()).toBe(INTERNAL_OFFER_DRAFT_SCHEMA);
    expect(getSchemaForField(undefined)).toBe(INTERNAL_OFFER_DRAFT_SCHEMA);
  });

  it("returns field-specific schema for each regeneratable field", () => {
    const rationaleSchema = getSchemaForField("rationale");
    expect(rationaleSchema.name).toBe("internal_offer_rationale");

    const riskSchema = getSchemaForField("risk_flags");
    expect(riskSchema.name).toBe("internal_offer_risk_flags");

    const talkingSchema = getSchemaForField("talking_points");
    expect(talkingSchema.name).toBe("internal_offer_talking_points");

    const approvalSchema = getSchemaForField("approval_notes");
    expect(approvalSchema.name).toBe("internal_offer_approval_notes");
  });
});
