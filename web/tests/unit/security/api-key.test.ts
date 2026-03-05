import { describe, expect, it } from "vitest";
import { buildApiKeyPrefix, hashApiKey, isApiKeyFormat } from "@/lib/security/api-key";

describe("api key helpers", () => {
  it("builds a stable prefix from full api key", () => {
    const apiKey = "qeem_1234567890abcdefghijklmnopqrstuvwxyz";
    expect(buildApiKeyPrefix(apiKey)).toBe("qeem_12345678...");
  });

  it("hashes full api key with sha256", () => {
    const hash = hashApiKey("qeem_test_key");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it("accepts only qeem_ formatted keys", () => {
    expect(isApiKeyFormat("qeem_valid")).toBe(true);
    expect(isApiKeyFormat("bearer qeem_valid")).toBe(false);
    expect(isApiKeyFormat("invalid")).toBe(false);
  });
});
