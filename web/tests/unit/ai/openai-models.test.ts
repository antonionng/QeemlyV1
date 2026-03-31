import { afterEach, describe, expect, it } from "vitest";
import {
  getAdvisoryModel,
  getChatModel,
  getComplianceScoringModel,
  getBenchmarkModel,
} from "@/lib/ai/openai";

const originalEnv = {
  OPENAI_CHAT_MODEL: process.env.OPENAI_CHAT_MODEL,
  OPENAI_ADVISORY_MODEL: process.env.OPENAI_ADVISORY_MODEL,
  OPENAI_COMPLIANCE_SCORING_MODEL: process.env.OPENAI_COMPLIANCE_SCORING_MODEL,
  OPENAI_BENCHMARK_MODEL: process.env.OPENAI_BENCHMARK_MODEL,
};

afterEach(() => {
  process.env.OPENAI_CHAT_MODEL = originalEnv.OPENAI_CHAT_MODEL;
  process.env.OPENAI_ADVISORY_MODEL = originalEnv.OPENAI_ADVISORY_MODEL;
  process.env.OPENAI_COMPLIANCE_SCORING_MODEL = originalEnv.OPENAI_COMPLIANCE_SCORING_MODEL;
  process.env.OPENAI_BENCHMARK_MODEL = originalEnv.OPENAI_BENCHMARK_MODEL;
});

describe("AI model selectors", () => {
  it("uses GPT-5.4 defaults when env is not set", () => {
    delete process.env.OPENAI_CHAT_MODEL;
    delete process.env.OPENAI_ADVISORY_MODEL;
    delete process.env.OPENAI_COMPLIANCE_SCORING_MODEL;
    delete process.env.OPENAI_BENCHMARK_MODEL;

    expect(getChatModel()).toBe("gpt-5.4-mini");
    expect(getAdvisoryModel()).toBe("gpt-5.4");
    expect(getComplianceScoringModel()).toBe("gpt-5.4");
    expect(getBenchmarkModel()).toBe("gpt-5.4");
  });

  it("respects explicit model overrides", () => {
    process.env.OPENAI_CHAT_MODEL = "gpt-5-mini-custom";
    process.env.OPENAI_ADVISORY_MODEL = "gpt-5.2-custom";
    process.env.OPENAI_COMPLIANCE_SCORING_MODEL = "gpt-5.2-compliance";
    process.env.OPENAI_BENCHMARK_MODEL = "gpt-5.3-bench";

    expect(getChatModel()).toBe("gpt-5-mini-custom");
    expect(getAdvisoryModel()).toBe("gpt-5.2-custom");
    expect(getComplianceScoringModel()).toBe("gpt-5.2-compliance");
    expect(getBenchmarkModel()).toBe("gpt-5.3-bench");
  });
});
