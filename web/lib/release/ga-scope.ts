export type FeatureKey =
  | "overview"
  | "benchmarks"
  | "salaryReview"
  | "reports"
  | "compliance"
  | "upload"
  | "team"
  | "settings"
  | "billing"
  | "integrations"
  | "adminExtras";

export const RELEASE_SCOPE = {
  channel: "ga",
  enabledFeatures: {
    overview: true,
    benchmarks: true,
    salaryReview: true,
    reports: true,
    compliance: true,
    upload: true,
    team: true,
    settings: true,
    billing: false,
    integrations: false,
    adminExtras: false,
  } satisfies Record<FeatureKey, boolean>,
  deferredFeatures: [
    "billing",
    "integrations",
    "admin extras",
    "advanced report builder",
  ],
} as const;

export function isFeatureEnabled(feature: FeatureKey): boolean {
  return RELEASE_SCOPE.enabledFeatures[feature];
}
