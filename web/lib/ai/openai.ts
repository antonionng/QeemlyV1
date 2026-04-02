import OpenAI from "openai";

let openaiClient: OpenAI | null = null;
const DEFAULT_CHAT_MODEL = "gpt-5.4-mini";
const DEFAULT_ADVISORY_MODEL = "gpt-5.4";
const DEFAULT_BENCHMARK_MODEL = "gpt-5.4";
const DEFAULT_BENCHMARK_BRIEFING_MODEL = "gpt-5.4-mini";

export function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openaiClient;
}

export function getAdvisoryModel(): string {
  return process.env.OPENAI_ADVISORY_MODEL || DEFAULT_ADVISORY_MODEL;
}

export function getChatModel(): string {
  return process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_ADVISORY_MODEL || DEFAULT_CHAT_MODEL;
}

export function getComplianceScoringModel(): string {
  return process.env.OPENAI_COMPLIANCE_SCORING_MODEL || getAdvisoryModel();
}

export function getBenchmarkModel(): string {
  return process.env.OPENAI_BENCHMARK_MODEL || DEFAULT_BENCHMARK_MODEL;
}

export function getBenchmarkBriefingModel(): string {
  return process.env.OPENAI_BENCHMARK_BRIEFING_MODEL || DEFAULT_BENCHMARK_BRIEFING_MODEL;
}
