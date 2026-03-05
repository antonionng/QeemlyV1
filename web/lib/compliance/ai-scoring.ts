import { getComplianceScoringModel, getOpenAIClient } from "@/lib/ai/openai";

type ComplianceAiScoringInput = {
  workspaceId: string;
  metrics: {
    activeEmployees: number;
    benchmarkCoveragePct: number;
    inBandPct: number;
    policyCompletionPct: number;
    expiringDocuments: number;
    overduePermits: number;
    overdueDeadlines: number;
    upcomingDeadlines?: number;
    expiringPermits?: number;
  };
  riskItems: Array<{
    area: string;
    level: number;
    status: "Critical" | "High" | "Moderate" | "Low";
    description: string;
  }>;
};

export type ComplianceAiScoringResult = {
  model: string;
  confidence: number;
  scoreDelta: number;
  reasons: string[];
  missingData: string[];
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

function safeNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string").slice(0, 8);
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    // Some models return prose around JSON; fallback to first object block.
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

export async function runComplianceAiScoring(
  input: ComplianceAiScoringInput
): Promise<ComplianceAiScoringResult> {
  const model = getComplianceScoringModel();

  try {
    const client = getOpenAIClient();
    const prompt = [
      "You are a compliance scoring assistant for a multi-tenant HR platform.",
      "Given tenant metrics and risk items, propose a bounded score adjustment and explain it.",
      "Do not include speculation. Use only the provided data.",
      "Return strict JSON only with keys:",
      "score_delta (number between -12 and 12), confidence (0-100), reasons (string[]), missing_data (string[]).",
      "",
      `workspace_id: ${input.workspaceId}`,
      `metrics: ${JSON.stringify(input.metrics)}`,
      `risk_items: ${JSON.stringify(input.riskItems)}`,
    ].join("\n");

    const response = await client.responses.create({
      model,
      input: prompt,
    });

    const parsed = extractJsonObject(response.output_text || "");
    const confidence = clamp(safeNumber(parsed?.confidence, 0), 0, 100);
    const scoreDelta = clamp(Math.round(safeNumber(parsed?.score_delta, 0) * 10) / 10, -12, 12);
    const reasons = safeStringArray(parsed?.reasons);
    const missingData = safeStringArray(parsed?.missing_data);

    return {
      model,
      confidence,
      scoreDelta,
      reasons,
      missingData,
    };
  } catch {
    return {
      model,
      confidence: 0,
      scoreDelta: 0,
      reasons: [],
      missingData: ["ai_scoring_unavailable"],
    };
  }
}
