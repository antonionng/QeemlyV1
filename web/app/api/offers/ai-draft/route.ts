import { NextResponse } from "next/server";
import { getOpenAIClient, getAdvisoryModel } from "@/lib/ai/openai";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { jsonServerError, jsonValidationError } from "@/lib/errors/http";
import type {
  InternalOfferAiDraftRequest,
  RegeneratableField,
} from "@/lib/offers/ai-draft";
import {
  buildInternalOfferDraftPrompt,
  getSchemaForField,
  normalizeDraftResponse,
} from "@/lib/offers/ai-draft-prompt";

const REGENERATABLE_FIELDS = new Set<RegeneratableField>([
  "rationale",
  "risk_flags",
  "talking_points",
  "approval_notes",
]);

function validateRequest(
  body: unknown,
): { ok: true; value: InternalOfferAiDraftRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body is required." };
  }

  const b = body as Record<string, unknown>;

  if (!b.role_title || typeof b.role_title !== "string") {
    return { ok: false, error: "role_title is required." };
  }
  if (!b.level_name || typeof b.level_name !== "string") {
    return { ok: false, error: "level_name is required." };
  }
  if (typeof b.offer_value !== "number" || b.offer_value <= 0) {
    return { ok: false, error: "offer_value must be a positive number." };
  }
  if (typeof b.target_percentile !== "number") {
    return { ok: false, error: "target_percentile is required." };
  }

  if (
    b.regenerate_field &&
    !REGENERATABLE_FIELDS.has(b.regenerate_field as RegeneratableField)
  ) {
    return { ok: false, error: `Invalid regenerate_field: ${String(b.regenerate_field)}` };
  }

  return {
    ok: true,
    value: {
      role_title: String(b.role_title),
      level_name: String(b.level_name),
      location_city: String(b.location_city ?? ""),
      location_country: String(b.location_country ?? ""),
      employment_type:
        b.employment_type === "expat" ? "expat" : "national",
      currency: String(b.currency ?? "SAR"),
      target_percentile: Number(b.target_percentile),
      offer_value: Number(b.offer_value),
      offer_low: Number(b.offer_low ?? Number(b.offer_value) * 0.96),
      offer_high: Number(b.offer_high ?? Number(b.offer_value) * 1.04),
      benchmark_source: (["market", "uploaded", "ai-estimated"].includes(
        String(b.benchmark_source),
      )
        ? String(b.benchmark_source)
        : "market") as InternalOfferAiDraftRequest["benchmark_source"],
      benchmark_percentiles:
        b.benchmark_percentiles &&
        typeof b.benchmark_percentiles === "object"
          ? (b.benchmark_percentiles as Record<string, number>)
          : {},
      package_breakdown:
        b.package_breakdown && typeof b.package_breakdown === "object"
          ? (b.package_breakdown as InternalOfferAiDraftRequest["package_breakdown"])
          : undefined,
      regenerate_field: b.regenerate_field as
        | RegeneratableField
        | undefined,
      existing_metadata:
        b.existing_metadata && typeof b.existing_metadata === "object"
          ? (b.existing_metadata as InternalOfferAiDraftRequest["existing_metadata"])
          : undefined,
    },
  };
}

export async function POST(request: Request) {
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json(
      { error: wsContext.error },
      { status: wsContext.status },
    );
  }

  const body = await request.json().catch(() => null);
  const validation = validateRequest(body);
  if (!validation.ok) {
    return jsonValidationError({ message: validation.error });
  }

  const req = validation.value;

  try {
    const client = getOpenAIClient();
    const prompt = buildInternalOfferDraftPrompt(req);
    const schema = getSchemaForField(req.regenerate_field);

    const response = await client.chat.completions.create({
      model: getAdvisoryModel(),
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are a compensation analyst. Return only JSON matching the requested schema. Do not include markdown.",
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: schema,
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty model response");
    }

    const parsed = JSON.parse(content) as Record<string, unknown>;

    if (req.regenerate_field) {
      return NextResponse.json({
        draft: { [req.regenerate_field]: parsed[req.regenerate_field] },
      });
    }

    const draft = normalizeDraftResponse(
      parsed,
      req.offer_low,
      req.offer_high,
    );

    return NextResponse.json({ draft });
  } catch (error) {
    return jsonServerError(error, {
      defaultMessage:
        "We could not generate the internal brief draft right now.",
      logLabel: "Internal offer AI draft failed",
    });
  }
}
