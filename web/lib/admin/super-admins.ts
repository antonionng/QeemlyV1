const NON_PRODUCTION_FALLBACK_ALLOWLIST = "ag@experrt.com";

export function getSuperAdminAllowlist(source = process.env.QEEMLY_SUPERADMINS): string[] {
  const fallback = process.env.NODE_ENV === "production" ? "" : NON_PRODUCTION_FALLBACK_ALLOWLIST;
  const raw = source?.trim() ? source : fallback;

  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperAdminEmail(email: string | null | undefined, allowlist = getSuperAdminAllowlist()) {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;
  return allowlist.includes(normalized);
}
