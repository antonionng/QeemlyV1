import { describe, expect, it } from "vitest";
import { extractOutputTextDelta } from "@/lib/ai/chat/stream";

describe("extractOutputTextDelta", () => {
  it("extracts only output_text delta events", () => {
    const delta = extractOutputTextDelta({
      type: "response.output_text.delta",
      delta: "hello",
    });
    expect(delta).toBe("hello");
  });

  it("ignores non-output text events even if they include delta keys", () => {
    const delta = extractOutputTextDelta({
      type: "response.function_call.delta",
      delta: "should not leak",
    });
    expect(delta).toBeNull();
  });
});
