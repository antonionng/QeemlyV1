import { describe, expect, it } from "vitest";
import { buildThreadTitle, summarizeTitleFromMessage } from "@/lib/ai/chat/threads";

describe("summarizeTitleFromMessage", () => {
  it("cleans whitespace and punctuation", () => {
    expect(summarizeTitleFromMessage("  How does this fit industry standards?  ")).toBe(
      "How does this fit industry standards"
    );
  });
});

describe("buildThreadTitle", () => {
  it("uses employee template when employee mode has a name", () => {
    expect(
      buildThreadTitle({
        mode: "employee",
        employeeName: "Dana Al-Harbi",
        firstUserMessage: "is this fair?",
      })
    ).toBe("Dana Al-Harbi compensation review");
  });

  it("falls back to summary for general mode", () => {
    expect(
      buildThreadTitle({
        mode: "general",
        firstUserMessage: "compare senior engineer salaries in dubai and riyadh",
      })
    ).toContain("compare senior engineer salaries");
  });
});
