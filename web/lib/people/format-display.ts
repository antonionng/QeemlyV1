const VISA_TYPE_LABELS: Record<string, string> = {
  work_permit: "Work Permit",
  employment_visa: "Employment Visa",
  residence_visa: "Residence Visa",
  transfer_visa: "Transfer Visa",
};

const VISA_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  expiring: "Expiring",
  expired: "Expired",
  pending: "Pending",
  cancelled: "Cancelled",
};

export function toTitleLabel(value: unknown): string {
  if (typeof value !== "string") return "";
  const cleaned = value.trim().replace(/[_-]+/g, " ");
  if (!cleaned) return "";
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function formatVisaType(value: unknown): string {
  if (typeof value !== "string") return "Not set";
  const key = value.trim().toLowerCase();
  return VISA_TYPE_LABELS[key] || toTitleLabel(key) || "Not set";
}

export function formatVisaStatus(value: unknown): string {
  if (typeof value !== "string") return "Not set";
  const key = value.trim().toLowerCase();
  return VISA_STATUS_LABELS[key] || toTitleLabel(key) || "Not set";
}

export function formatTimelineEventType(value: unknown): string {
  const label = toTitleLabel(value);
  return label || "Profile Updated";
}

export function formatOptionalLabel(value: unknown, fallback = "Not set"): string {
  const label = toTitleLabel(value);
  return label || fallback;
}
