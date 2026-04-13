import { describe, expect, it } from "vitest";
import type { OfferMode, CreateOfferPayload, InternalOfferMetadata, AdvisedBaseline } from "@/lib/offers/types";

describe("Offer mode validation", () => {
  const VALID_MODES: OfferMode[] = ["candidate_manual", "candidate_advised", "internal"];

  it("OfferMode type allows exactly three values", () => {
    expect(VALID_MODES).toHaveLength(3);
    expect(VALID_MODES).toContain("candidate_manual");
    expect(VALID_MODES).toContain("candidate_advised");
    expect(VALID_MODES).toContain("internal");
  });

  it("CreateOfferPayload requires offer_mode field", () => {
    const payload: CreateOfferPayload = {
      offer_mode: "candidate_manual",
      role_id: "pm",
      level_id: "ic3",
      location_id: "dubai",
      employment_type: "national",
      target_percentile: 50,
      offer_value: 240000,
      offer_low: 230400,
      offer_high: 249600,
      currency: "AED",
    };
    expect(payload.offer_mode).toBe("candidate_manual");
  });

  it("InternalOfferMetadata captures rationale and guardrails", () => {
    const meta: InternalOfferMetadata = {
      rationale: "Strong candidate with competing offer",
      band_position: "above",
      negotiation_floor: 220000,
      negotiation_ceiling: 260000,
      risk_flags: ["Competing offer at higher band", "Flight risk"],
      talking_points: ["Emphasize equity component", "Highlight career path"],
      approval_notes: "Director approval required due to above-band positioning",
    };

    expect(meta.band_position).toBe("above");
    expect(meta.risk_flags).toHaveLength(2);
    expect(meta.talking_points).toHaveLength(2);
    expect(meta.negotiation_floor).toBeLessThan(meta.negotiation_ceiling!);
  });

  it("AdvisedBaseline captures the original recommendation", () => {
    const baseline: AdvisedBaseline = {
      recommended_value: 240000,
      recommended_low: 230400,
      recommended_high: 249600,
      recommended_percentile: 50,
    };

    expect(baseline.recommended_value).toBe(240000);
    expect(baseline.recommended_low).toBeLessThan(baseline.recommended_value);
    expect(baseline.recommended_high).toBeGreaterThan(baseline.recommended_value);
  });

  it("internal mode payload does not require recipient fields", () => {
    const payload: CreateOfferPayload = {
      offer_mode: "internal",
      role_id: "swe",
      level_id: "ic4",
      location_id: "riyadh",
      employment_type: "expat",
      target_percentile: 75,
      offer_value: 360000,
      offer_low: 345600,
      offer_high: 374400,
      currency: "SAR",
      internal_metadata: {
        rationale: "Market re-alignment",
        band_position: "in-band",
      },
    };

    expect(payload.employee_id).toBeUndefined();
    expect(payload.recipient_name).toBeUndefined();
    expect(payload.recipient_email).toBeUndefined();
    expect(payload.internal_metadata?.band_position).toBe("in-band");
  });

  it("candidate_advised payload can carry advised_baseline", () => {
    const payload: CreateOfferPayload = {
      offer_mode: "candidate_advised",
      role_id: "pm",
      level_id: "ic3",
      location_id: "dubai",
      employment_type: "national",
      target_percentile: 50,
      offer_value: 250000,
      offer_low: 240000,
      offer_high: 260000,
      currency: "AED",
      recipient_name: "Jane Doe",
      recipient_email: "jane@example.com",
      advised_baseline: {
        recommended_value: 240000,
        recommended_low: 230400,
        recommended_high: 249600,
        recommended_percentile: 50,
      },
    };

    expect(payload.advised_baseline?.recommended_value).toBe(240000);
    expect(payload.offer_value).toBeGreaterThan(payload.advised_baseline!.recommended_value);
  });
});
