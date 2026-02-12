// Integration Types

export type IntegrationCategory = "notification" | "hris" | "ats" | "developer";

export type ConnectionMethod = "oauth" | "merge_link" | "api_key" | "manual";

export type IntegrationStatus = "connected" | "disconnected" | "error" | "syncing";

export type SyncFrequency = "realtime" | "hourly" | "daily" | "weekly" | "manual";

export type SyncType = "full" | "incremental" | "webhook";

export type SyncLogStatus = "success" | "partial" | "failed";

// Provider definition (static registry)
export interface IntegrationProvider {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  logo: string; // URL or path to logo
  connectionMethod: ConnectionMethod;
  mergeIntegration?: string; // Merge.dev integration slug
  comingSoon?: boolean;
  features: string[];
  docsUrl?: string;
}

// Connected integration (from DB)
export interface Integration {
  id: string;
  workspace_id: string;
  provider: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  config: Record<string, unknown>;
  last_sync_at: string | null;
  sync_frequency: SyncFrequency;
  created_at: string;
  updated_at: string;
}

// Sync log entry
export interface IntegrationSyncLog {
  id: string;
  integration_id: string;
  sync_type: SyncType;
  status: SyncLogStatus;
  records_created: number;
  records_updated: number;
  records_failed: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

// Notification rule
export interface NotificationRule {
  id: string;
  workspace_id: string;
  integration_id: string;
  event_type: string;
  channel: string | null;
  enabled: boolean;
  config: Record<string, unknown>;
}

// API Key
export interface ApiKey {
  id: string;
  workspace_id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_by: string;
  created_at: string;
}

// Outgoing Webhook
export interface OutgoingWebhook {
  id: string;
  workspace_id: string;
  url: string;
  events: string[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Webhook delivery log
export interface WebhookDeliveryLog {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  status_code: number | null;
  response_body: string | null;
  attempted_at: string;
  duration_ms: number | null;
  attempt_number: number;
}

// Notification event types
export const NOTIFICATION_EVENTS = [
  { id: "sync_complete", label: "Sync Completed", description: "HRIS sync finished successfully", defaultEnabled: true },
  { id: "sync_error", label: "Sync Error", description: "Sync failed or partially failed", defaultEnabled: true },
  { id: "out_of_band_alert", label: "Out of Band Alert", description: "Employees moved outside salary bands", defaultEnabled: true },
  { id: "review_cycle_reminder", label: "Review Cycle Reminder", description: "Salary review cycle starting or due", defaultEnabled: true },
  { id: "compliance_warning", label: "Compliance Warning", description: "Pay equity or compliance flag triggered", defaultEnabled: true },
  { id: "new_employee", label: "New Employee", description: "New employee synced from HRIS", defaultEnabled: false },
  { id: "benchmark_update", label: "Benchmark Update", description: "New benchmark data available", defaultEnabled: false },
] as const;

export type NotificationEventType = typeof NOTIFICATION_EVENTS[number]["id"];

// API scopes
export const API_SCOPES = [
  { id: "employees:read", label: "Read Employees", description: "View employee data" },
  { id: "employees:write", label: "Write Employees", description: "Create and update employees" },
  { id: "benchmarks:read", label: "Read Benchmarks", description: "View benchmark data" },
  { id: "benchmarks:write", label: "Write Benchmarks", description: "Upload benchmark data" },
  { id: "compensation:read", label: "Read Compensation", description: "View compensation history" },
  { id: "compensation:write", label: "Write Compensation", description: "Push compensation changes" },
  { id: "integrations:read", label: "Read Integrations", description: "View integration status" },
] as const;

export type ApiScope = typeof API_SCOPES[number]["id"];
