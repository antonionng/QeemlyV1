import crypto from "crypto";

const MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

export type OAuthStatePayload = {
  provider: string;
  workspace_id: string;
  integration_id: string;
  nonce: string;
  issued_at: number;
};

function getSecret(): string {
  const secret = process.env.QEEMLY_OAUTH_STATE_SECRET;
  if (!secret) {
    throw new Error("QEEMLY_OAUTH_STATE_SECRET is not configured");
  }
  return secret;
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(encodedPayload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function createOAuthState(payload: Omit<OAuthStatePayload, "nonce" | "issued_at">): string {
  const secret = getSecret();
  const statePayload: OAuthStatePayload = {
    ...payload,
    nonce: crypto.randomBytes(12).toString("base64url"),
    issued_at: Date.now(),
  };
  const encodedPayload = toBase64Url(JSON.stringify(statePayload));
  const signature = signPayload(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function verifyOAuthState(state: string): OAuthStatePayload {
  const secret = getSecret();
  const [encodedPayload, signature] = state.split(".");

  if (!encodedPayload || !signature) {
    throw new Error("Invalid OAuth state format");
  }

  const expectedSignature = signPayload(encodedPayload, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (signatureBuffer.length !== expectedBuffer.length) {
    throw new Error("Invalid OAuth state signature");
  }

  const valid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

  if (!valid) {
    throw new Error("Invalid OAuth state signature");
  }

  const payload = JSON.parse(fromBase64Url(encodedPayload)) as OAuthStatePayload;
  if (!payload.provider || !payload.workspace_id || !payload.integration_id || !payload.issued_at) {
    throw new Error("OAuth state payload is missing fields");
  }

  if (Date.now() - payload.issued_at > MAX_AGE_MS) {
    throw new Error("OAuth state expired");
  }

  return payload;
}
