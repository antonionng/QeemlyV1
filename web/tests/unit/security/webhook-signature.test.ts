import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { verifyHmacSha256Signature } from "@/lib/security/webhook-signature";

describe("verifyHmacSha256Signature", () => {
  it("validates a correct signature", () => {
    const secret = "top-secret";
    const payload = JSON.stringify({ event: "employee.created", id: "evt_1" });
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload, "utf8")
      .digest("hex");

    expect(verifyHmacSha256Signature(payload, expectedSignature, secret)).toBe(true);
  });

  it("rejects an invalid signature", () => {
    const payload = JSON.stringify({ event: "employee.created" });
    expect(verifyHmacSha256Signature(payload, "bad-signature", "top-secret")).toBe(false);
  });
});
