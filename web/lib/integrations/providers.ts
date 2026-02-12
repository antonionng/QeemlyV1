// Static registry of all supported integration providers

import type { IntegrationProvider } from "./types";

// ============================================================================
// NOTIFICATION PROVIDERS
// ============================================================================

const notificationProviders: IntegrationProvider[] = [
  {
    id: "slack",
    name: "Slack",
    category: "notification",
    description: "Send compensation alerts, review reminders, and sync notifications to Slack channels.",
    logo: "/integrations/slack.svg",
    connectionMethod: "oauth",
    features: ["notifications", "channel_picker", "event_rules"],
    docsUrl: "https://api.slack.com/",
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    category: "notification",
    description: "Deliver alerts and updates directly to your Teams channels and chats.",
    logo: "/integrations/teams.svg",
    connectionMethod: "oauth",
    features: ["notifications", "channel_picker", "event_rules"],
    docsUrl: "https://learn.microsoft.com/en-us/microsoftteams/",
  },
  {
    id: "email_digest",
    name: "Email Digest",
    category: "notification",
    description: "Receive periodic email summaries of compensation changes, alerts, and sync activity.",
    logo: "/integrations/email.svg",
    connectionMethod: "manual",
    features: ["notifications", "digest"],
  },
];

// ============================================================================
// HRIS PROVIDERS
// ============================================================================

// Global HRIS (via Merge.dev)
const globalHrisProviders: IntegrationProvider[] = [
  {
    id: "bamboohr",
    name: "BambooHR",
    category: "hris",
    description: "Sync employee data, org structure, and compensation from BambooHR.",
    logo: "/integrations/bamboohr.svg",
    connectionMethod: "merge_link",
    mergeIntegration: "bamboohr",
    features: ["employee_sync", "comp_sync", "org_sync"],
  },
  {
    id: "workday",
    name: "Workday",
    category: "hris",
    description: "Import employee records, compensation, and job data from Workday HCM.",
    logo: "/integrations/workday.svg",
    connectionMethod: "merge_link",
    mergeIntegration: "workday",
    features: ["employee_sync", "comp_sync", "org_sync", "performance_sync"],
  },
  {
    id: "sap_successfactors",
    name: "SAP SuccessFactors",
    category: "hris",
    description: "Connect your SAP SuccessFactors instance to sync employees and compensation.",
    logo: "/integrations/sap.svg",
    connectionMethod: "merge_link",
    mergeIntegration: "sap-successfactors",
    features: ["employee_sync", "comp_sync", "org_sync"],
  },
  {
    id: "hibob",
    name: "HiBob",
    category: "hris",
    description: "Automatically sync employee profiles and salary data from HiBob.",
    logo: "/integrations/hibob.svg",
    connectionMethod: "merge_link",
    mergeIntegration: "hibob",
    features: ["employee_sync", "comp_sync", "org_sync"],
  },
  {
    id: "personio",
    name: "Personio",
    category: "hris",
    description: "Pull employee data, salaries, and organisational structure from Personio.",
    logo: "/integrations/personio.svg",
    connectionMethod: "merge_link",
    mergeIntegration: "personio",
    features: ["employee_sync", "comp_sync", "org_sync"],
  },
  {
    id: "gusto",
    name: "Gusto",
    category: "hris",
    description: "Sync payroll, employee data, and compensation from Gusto.",
    logo: "/integrations/gusto.svg",
    connectionMethod: "merge_link",
    mergeIntegration: "gusto",
    features: ["employee_sync", "comp_sync", "payroll_sync"],
  },
  {
    id: "rippling",
    name: "Rippling",
    category: "hris",
    description: "Import employee records, departments, and compensation from Rippling.",
    logo: "/integrations/rippling.svg",
    connectionMethod: "merge_link",
    mergeIntegration: "rippling",
    features: ["employee_sync", "comp_sync", "org_sync"],
  },
  {
    id: "deel",
    name: "Deel",
    category: "hris",
    description: "Sync global contractor and employee data from Deel.",
    logo: "/integrations/deel.svg",
    connectionMethod: "merge_link",
    mergeIntegration: "deel",
    features: ["employee_sync", "comp_sync"],
  },
];

// GCC-Specific HRIS (Native connectors)
const gccHrisProviders: IntegrationProvider[] = [
  {
    id: "zenhr",
    name: "ZenHR",
    category: "hris",
    description: "Sync employee data and payroll from ZenHR, the leading UAE/GCC HRMS.",
    logo: "/integrations/zenhr.svg",
    connectionMethod: "api_key",
    features: ["employee_sync", "comp_sync", "org_sync"],
    docsUrl: "https://www.zenhr.com/",
  },
  {
    id: "bayzat",
    name: "Bayzat",
    category: "hris",
    description: "Import HR, payroll, and employee data from Bayzat's platform.",
    logo: "/integrations/bayzat.svg",
    connectionMethod: "api_key",
    features: ["employee_sync", "comp_sync", "payroll_sync"],
    docsUrl: "https://www.bayzat.com/",
  },
  {
    id: "gulfhr",
    name: "gulfHR",
    category: "hris",
    description: "Connect gulfHR to sync employee records and payroll data for MEA region.",
    logo: "/integrations/gulfhr.svg",
    connectionMethod: "api_key",
    features: ["employee_sync", "comp_sync"],
    comingSoon: true,
    docsUrl: "https://www.gulfhr.com/",
  },
  {
    id: "remotepass",
    name: "RemotePass",
    category: "hris",
    description: "Sync global team data from RemotePass including onboarding and payroll.",
    logo: "/integrations/remotepass.svg",
    connectionMethod: "api_key",
    features: ["employee_sync", "comp_sync"],
    comingSoon: true,
  },
  {
    id: "sapience",
    name: "Sapience HRMS",
    category: "hris",
    description: "Import employee and payroll data from Sapience HCM platform.",
    logo: "/integrations/sapience.svg",
    connectionMethod: "api_key",
    features: ["employee_sync", "comp_sync"],
    comingSoon: true,
  },
];

// Manual / Fallback
const manualProviders: IntegrationProvider[] = [
  {
    id: "csv_upload",
    name: "CSV / XLSX Upload",
    category: "hris",
    description: "Manually upload employee and compensation data via spreadsheet files.",
    logo: "/integrations/csv.svg",
    connectionMethod: "manual",
    features: ["employee_sync", "comp_sync", "benchmark_upload"],
  },
  {
    id: "sftp",
    name: "SFTP Sync",
    category: "hris",
    description: "Automatically pull data files from a secure SFTP server on a schedule.",
    logo: "/integrations/sftp.svg",
    connectionMethod: "manual",
    features: ["employee_sync", "comp_sync"],
    comingSoon: true,
  },
];

// ============================================================================
// ATS PROVIDERS
// ============================================================================

const atsProviders: IntegrationProvider[] = [
  {
    id: "greenhouse",
    name: "Greenhouse",
    category: "ats",
    description: "Sync offer data and new hires from Greenhouse to validate compensation ranges.",
    logo: "/integrations/greenhouse.svg",
    connectionMethod: "merge_link",
    mergeIntegration: "greenhouse",
    features: ["offer_sync", "new_hire_sync"],
  },
  {
    id: "lever",
    name: "Lever",
    category: "ats",
    description: "Import candidate offers and hiring data from Lever.",
    logo: "/integrations/lever.svg",
    connectionMethod: "merge_link",
    mergeIntegration: "lever",
    features: ["offer_sync", "new_hire_sync"],
  },
  {
    id: "ashby",
    name: "Ashby",
    category: "ats",
    description: "Connect Ashby to auto-populate new hires and validate offer ranges.",
    logo: "/integrations/ashby.svg",
    connectionMethod: "merge_link",
    mergeIntegration: "ashby",
    features: ["offer_sync", "new_hire_sync"],
  },
  {
    id: "workable",
    name: "Workable",
    category: "ats",
    description: "Sync recruiting data and offers from Workable.",
    logo: "/integrations/workable.svg",
    connectionMethod: "merge_link",
    mergeIntegration: "workable",
    features: ["offer_sync", "new_hire_sync"],
    comingSoon: true,
  },
];

// ============================================================================
// COMBINED REGISTRY
// ============================================================================

export const ALL_PROVIDERS: IntegrationProvider[] = [
  ...notificationProviders,
  ...globalHrisProviders,
  ...gccHrisProviders,
  ...manualProviders,
  ...atsProviders,
];

export function getProvidersByCategory(category: IntegrationProvider["category"]) {
  return ALL_PROVIDERS.filter((p) => p.category === category);
}

export function getProvider(id: string) {
  return ALL_PROVIDERS.find((p) => p.id === id);
}

export function getNotificationProviders() {
  return notificationProviders;
}

export function getHrisProviders() {
  return { global: globalHrisProviders, gcc: gccHrisProviders, manual: manualProviders };
}

export function getAtsProviders() {
  return atsProviders;
}

// Provider logo fallback - generates initials-based placeholder
export function getProviderInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Category display labels
export const CATEGORY_LABELS: Record<string, { label: string; description: string }> = {
  notification: {
    label: "Notifications",
    description: "Send alerts and reminders to your team's communication tools.",
  },
  hris: {
    label: "HRIS (Employee Data Sync)",
    description: "Automatically sync employee records, compensation, and org structure from your HR system.",
  },
  ats: {
    label: "ATS (Recruiting)",
    description: "Connect your applicant tracking system to validate offers and auto-populate new hires.",
  },
  developer: {
    label: "Developer / Custom API",
    description: "Build custom integrations with API keys, endpoint docs, webhooks, and code examples.",
  },
};
