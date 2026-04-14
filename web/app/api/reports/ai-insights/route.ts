import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient, getAdvisoryModel } from "@/lib/ai/openai";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { composeAnalytics } from "@/lib/reports/analytics";
import {
  buildAnalyticsInsightsPrompt,
  ANALYTICS_INSIGHTS_SCHEMA,
  normalizeInsightsResponse,
  ANALYSIS_FOCUS_OPTIONS,
  type AnalysisFocus,
} from "@/lib/reports/ai-insights-prompt";
import { jsonServerError } from "@/lib/errors/http";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const VALID_FOCUS_IDS = new Set(ANALYSIS_FOCUS_OPTIONS.map((o) => o.id));

export async function POST(request: NextRequest) {
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json(
      { error: wsContext.error },
      { status: wsContext.status },
    );
  }

  const body = await request.json().catch(() => ({}));
  const rawFocus = (body as Record<string, unknown>).focus;
  const focus: AnalysisFocus =
    typeof rawFocus === "string" && VALID_FOCUS_IDS.has(rawFocus as AnalysisFocus)
      ? (rawFocus as AnalysisFocus)
      : "executive_summary";

  try {
    const analytics = await composeAnalytics(wsContext.context.workspace_id);
    const prompt = buildAnalyticsInsightsPrompt(analytics, focus);
    const client = getOpenAIClient();

    const response = await client.chat.completions.create({
      model: getAdvisoryModel(),
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are a compensation analytics advisor. Return only JSON matching the requested schema. Do not include markdown.",
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: ANALYTICS_INSIGHTS_SCHEMA,
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty model response");
    }

    const parsed = JSON.parse(content) as Record<string, unknown>;
    const insights = normalizeInsightsResponse(parsed);

    return NextResponse.json({ insights });
  } catch (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not generate analytics insights right now.",
      logLabel: "Analytics AI insights failed",
    });
  }
}
