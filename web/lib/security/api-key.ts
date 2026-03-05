import crypto from "node:crypto";

const API_KEY_PREFIX = "qeem_";

export function isApiKeyFormat(apiKey: string): boolean {
  return apiKey.startsWith(API_KEY_PREFIX) && apiKey.length > API_KEY_PREFIX.length;
}

export function buildApiKeyPrefix(apiKey: string): string {
  return `${apiKey.slice(0, 13)}...`;
}

export function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}
