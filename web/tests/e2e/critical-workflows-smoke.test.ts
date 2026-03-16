import { describe, expect, it } from "vitest";
import { isFeatureEnabled } from "@/lib/release/ga-scope";

describe("critical workflow smoke checks", () => {
  it("keeps launch-critical workflow features enabled", () => {
    expect(isFeatureEnabled("overview")).toBe(true);
    expect(isFeatureEnabled("benchmarks")).toBe(true);
    expect(isFeatureEnabled("salaryReview")).toBe(true);
    expect(isFeatureEnabled("team")).toBe(true);
    expect(isFeatureEnabled("upload")).toBe(true);
    expect(isFeatureEnabled("integrations")).toBe(true);
  });
});
