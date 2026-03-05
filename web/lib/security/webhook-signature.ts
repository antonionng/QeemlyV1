import crypto from "node:crypto";

function normalizeHex(signature: string): string {
  return signature.startsWith("sha256=") ? signature.slice(7) : signature;
}

export function verifyHmacSha256Signature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");

  const provided = normalizeHex(signature);
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(provided, "utf8");

  if (expectedBuffer.length !== providedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}
