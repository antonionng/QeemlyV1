import type { NormalizedInsightsResponse } from "./ai-insights-prompt";

export type { NormalizedInsightsResponse };

export async function fetchAnalyticsInsights(): Promise<NormalizedInsightsResponse> {
  const res = await fetch("/api/reports/ai-insights", { method: "POST" });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(
      (body as { error?: string } | null)?.error ??
        "Unable to generate insights right now.",
    );
  }

  const data = (await res.json()) as { insights: NormalizedInsightsResponse };
  return data.insights;
}
