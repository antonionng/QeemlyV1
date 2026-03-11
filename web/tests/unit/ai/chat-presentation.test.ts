import { describe, expect, it } from "vitest";
import { parseAssistantMessageBlocks } from "@/lib/ai/chat/presentation";

describe("parseAssistantMessageBlocks", () => {
  it("normalizes markdown headings into plain paragraph labels", () => {
    expect(parseAssistantMessageBlocks("### Actions to Take:\n- Review salary")).toEqual([
      { kind: "paragraph", text: "Actions to Take:" },
      { kind: "unordered-list", items: ["Review salary"] },
    ]);
  });

  it("preserves ordered lists for helper answers", () => {
    expect(parseAssistantMessageBlocks("1. Antonio\n2. Mina")).toEqual([
      { kind: "ordered-list", items: ["Antonio", "Mina"] },
    ]);
  });
});
