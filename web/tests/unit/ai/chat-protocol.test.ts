import { describe, expect, it } from "vitest";
import {
  parseEmployeeStructuredAnswer,
  validateChatRequest,
} from "@/lib/ai/chat/protocol";

describe("validateChatRequest", () => {
  it("accepts general mode with sanitized message", () => {
    const result = validateChatRequest({
      mode: "general",
      message: "   hello   world  ",
      threadId: "thread-123",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.mode).toBe("general");
      expect(result.value.message).toBe("hello world");
    }
  });

  it("requires employeeId for employee mode", () => {
    const result = validateChatRequest({
      mode: "employee",
      message: "What should I do?",
      threadId: "thread-123",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.error).toContain("employeeId");
    }
  });

  it("requires threadId", () => {
    const result = validateChatRequest({
      mode: "general",
      message: "hello",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.error).toContain("threadId");
    }
  });
});

describe("parseEmployeeStructuredAnswer", () => {
  it("parses valid JSON output", () => {
    const parsed = parseEmployeeStructuredAnswer(
      JSON.stringify({
        answer: "Increase by 8%",
        confidence: 82,
        reasons: ["Below benchmark"],
        missing_data: ["Recent offer data"],
      })
    );

    expect(parsed.answer).toBe("Increase by 8%");
    expect(parsed.confidence).toBe(82);
    expect(parsed.reasons).toEqual(["Below benchmark"]);
    expect(parsed.missing_data).toEqual(["Recent offer data"]);
  });

  it("falls back to plain text output", () => {
    const parsed = parseEmployeeStructuredAnswer("Plain text response");
    expect(parsed.answer).toBe("Plain text response");
    expect(parsed.confidence).toBe(60);
  });

  it("parses fenced JSON output", () => {
    const parsed = parseEmployeeStructuredAnswer(
      "```json\n{\"answer\":\"Use benchmark review\",\"confidence\":77,\"reasons\":[\"Data quality\"],\"missing_data\":[\"Peer salaries\"]}\n```"
    );
    expect(parsed.answer).toBe("Use benchmark review");
    expect(parsed.confidence).toBe(77);
    expect(parsed.reasons).toEqual(["Data quality"]);
    expect(parsed.missing_data).toEqual(["Peer salaries"]);
  });

  it("extracts first JSON object from noisy output", () => {
    const parsed = parseEmployeeStructuredAnswer(
      'prefix text {"answer":"Insufficient benchmark data","confidence":30,"reasons":["No peer data"],"missing_data":["Benchmark data"]} trailing {"answer":"duplicate"}'
    );
    expect(parsed.answer).toBe("Insufficient benchmark data");
    expect(parsed.confidence).toBe(30);
    expect(parsed.reasons).toEqual(["No peer data"]);
    expect(parsed.missing_data).toEqual(["Benchmark data"]);
  });
});
