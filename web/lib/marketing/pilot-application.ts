export type PilotApplicationPayload = {
  name: string;
  jobRole: string;
  company: string;
  companySize: string;
  industry: string;
  workEmail: string;
  phoneOrWhatsapp?: string;
  sourceCta?: string;
  sourcePath?: string;
};

export type PilotApplicationErrors = Partial<Record<keyof PilotApplicationPayload, string>>;

export const PILOT_COMPANY_SIZE_OPTIONS = ["1-20", "21-50", "51-200", "201-1000", "1000+"] as const;

const BLOCKED_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
]);

function isEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getDomain(email: string) {
  return email.trim().toLowerCase().split("@")[1] ?? "";
}

export function normalizePilotApplication(payload: Partial<PilotApplicationPayload>): PilotApplicationPayload {
  return {
    name: (payload.name ?? "").trim(),
    jobRole: (payload.jobRole ?? "").trim(),
    company: (payload.company ?? "").trim(),
    companySize: (payload.companySize ?? "").trim(),
    industry: (payload.industry ?? "").trim(),
    workEmail: (payload.workEmail ?? "").trim().toLowerCase(),
    phoneOrWhatsapp: (payload.phoneOrWhatsapp ?? "").trim(),
    sourceCta: (payload.sourceCta ?? "").trim(),
    sourcePath: (payload.sourcePath ?? "").trim(),
  };
}

export function validatePilotApplication(payload: Partial<PilotApplicationPayload>): PilotApplicationErrors {
  const errors: PilotApplicationErrors = {};
  const normalized = normalizePilotApplication(payload);

  if (normalized.name.length < 2) errors.name = "Please enter your name.";
  if (normalized.jobRole.length < 2) errors.jobRole = "Please enter your job role.";
  if (normalized.company.length < 2) errors.company = "Please enter your company name.";
  if (!PILOT_COMPANY_SIZE_OPTIONS.includes(normalized.companySize as (typeof PILOT_COMPANY_SIZE_OPTIONS)[number])) {
    errors.companySize = "Please select your company size.";
  }
  if (normalized.industry.length < 2) errors.industry = "Please enter your industry.";
  if (!isEmail(normalized.workEmail)) {
    errors.workEmail = "Please enter a valid work email.";
  } else if (BLOCKED_EMAIL_DOMAINS.has(getDomain(normalized.workEmail))) {
    errors.workEmail = "Please use your work email.";
  }

  return errors;
}
