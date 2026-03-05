import { afterEach, describe, expect, it } from "vitest";
import {
  getAdvisoryModel,
  getChatModel,
  getComplianceScoringModel,
} from "@/lib/ai/openai";

const originalEnv = {
  OPENAI_CHAT_MODEL: process.env.OPENAI_CHAT_MODEL,
  OPENAI_ADVISORY_MODEL: process.env.OPENAI_ADVISORY_MODEL,
  OPENAI_COMPLIANCE_SCORING_MODEL: process.env.OPENAI_COMPLIANCE_SCORING_MODEL,
};

afterEach(() => {
  process.env.OPENAI_CHAT_MODEL = originalEnv.OPENAI_CHAT_MODEL;
  process.env.OPENAI_ADVISORY_MODEL = originalEnv.OPENAI_ADVISORY_MODEL;
  process.env.OPENAI_COMPLIANCE_SCORING_MODEL = originalEnv.OPENAI_COMPLIANCE_SCORING_MODEL;
});

describe("AI model selectors", () => {
  it("uses GPT-5.2 defaults when env is not set", () => {
    delete process.env.OPENAI_CHAT_MODEL;
    delete process.env.OPENAI_ADVISORY_MODEL;
    delete process.env.OPENAI_COMPLIANCE_SCORING_MODEL;

    expect(getChatModel()).toBe("gpt-5-mini");
    expect(getAdvisoryModel()).toBe("gpt-5.2");
    expect(getComplianceScoringModel()).toBe("gpt-5.2");
  });

  it("respects explicit model overrides", () => {
    process.env.OPENAI_CHAT_MODEL = "gpt-5-mini-custom";
    process.env.OPENAI_ADVISORY_MODEL = "gpt-5.2-custom";
    process.env.OPENAI_COMPLIANCE_SCORING_MODEL = "gpt-5.2-compliance";

    expect(getChatModel()).toBe("gpt-5-mini-custom");
    expect(getAdvisoryModel()).toBe("gpt-5.2-custom");
    expect(getComplianceScoringModel()).toBe("gpt-5.2-compliance");
  });
});
