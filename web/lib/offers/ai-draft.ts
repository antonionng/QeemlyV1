import type { InternalOfferMetadata } from "./types";

// ---------------------------------------------------------------------------
// Request: context the server needs to generate an internal brief draft
// ---------------------------------------------------------------------------

export interface InternalOfferAiDraftRequest {
  role_title: string;
  level_name: string;
  location_city: string;
  location_country: string;
  employment_type: "national" | "expat";
  currency: string;
  target_percentile: number;
  offer_value: number;
  offer_low: number;
  offer_high: number;
  benchmark_source: "market" | "uploaded" | "ai-estimated";
  benchmark_percentiles: Record<string, number>;
  package_breakdown?: {
    basic_pct: number;
    housing_pct: number;
    transport_pct: number;
    other_pct: number;
  };
  /** When re-generating a single section, specify the field key. */
  regenerate_field?: RegeneratableField;
  /** Existing values so the model can preserve context during single-field regen. */
  existing_metadata?: Partial<InternalOfferMetadata>;
}

export type RegeneratableField =
  | "rationale"
  | "risk_flags"
  | "talking_points"
  | "approval_notes";

// ---------------------------------------------------------------------------
// Response: mirrors InternalOfferMetadata exactly
// ---------------------------------------------------------------------------

export type InternalOfferAiDraftResponse = InternalOfferMetadata;

// ---------------------------------------------------------------------------
// Client helper
// ---------------------------------------------------------------------------

export async function fetchInternalOfferAiDraft(
  payload: InternalOfferAiDraftRequest,
): Promise<InternalOfferAiDraftResponse> {
  const res = await fetch("/api/offers/ai-draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(
      (body as { error?: string } | null)?.error ??
        "Unable to generate a draft right now.",
    );
  }

  const data = (await res.json()) as { draft: InternalOfferAiDraftResponse };
  return data.draft;
}
