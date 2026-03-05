import { describe, expect, it } from "vitest";
import { isFeatureEnabled, RELEASE_SCOPE } from "@/lib/release/ga-scope";

describe("ga scope", () => {
  it("exposes critical workflows in GA", () => {
    expect(isFeatureEnabled("overview")).toBe(true);
    expect(isFeatureEnabled("benchmarks")).toBe(true);
    expect(isFeatureEnabled("salaryReview")).toBe(true);
    expect(isFeatureEnabled("team")).toBe(true);
  });

  it("keeps known non-GA surfaces disabled", () => {
    expect(isFeatureEnabled("billing")).toBe(false);
    expect(isFeatureEnabled("integrations")).toBe(false);
  });

  it("includes explicit deferred feature metadata", () => {
    expect(RELEASE_SCOPE.deferredFeatures.length).toBeGreaterThan(0);
  });
});
