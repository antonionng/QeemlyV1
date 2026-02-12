// Integrations Zustand Store
// Manages integration state with localStorage persistence for the UI layer.
// In production, this would be backed by Supabase queries.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Integration,
  IntegrationSyncLog,
  NotificationRule,
  ApiKey,
  OutgoingWebhook,
  WebhookDeliveryLog,
  IntegrationStatus,
  SyncFrequency,
} from "./types";

// ============================================================================
// MOCK DATA (simulates DB state for UI development)
// ============================================================================

const MOCK_INTEGRATIONS: Integration[] = [];

const MOCK_SYNC_LOGS: IntegrationSyncLog[] = [];

const MOCK_API_KEYS: ApiKey[] = [];

const MOCK_WEBHOOKS: OutgoingWebhook[] = [];

// ============================================================================
// STORE
// ============================================================================

interface IntegrationsState {
  // Connected integrations
  integrations: Integration[];
  syncLogs: IntegrationSyncLog[];
  notificationRules: NotificationRule[];

  // Developer hub
  apiKeys: ApiKey[];
  webhooks: OutgoingWebhook[];
  webhookDeliveries: WebhookDeliveryLog[];

  // Actions - Integrations
  connectIntegration: (provider: string, category: Integration["category"], config?: Record<string, unknown>) => Integration;
  disconnectIntegration: (id: string) => void;
  updateIntegrationStatus: (id: string, status: IntegrationStatus) => void;
  updateIntegrationConfig: (id: string, config: Record<string, unknown>) => void;
  updateSyncFrequency: (id: string, frequency: SyncFrequency) => void;
  getIntegration: (provider: string) => Integration | undefined;

  // Actions - Sync Logs
  addSyncLog: (log: Omit<IntegrationSyncLog, "id">) => void;
  getSyncLogs: (integrationId: string) => IntegrationSyncLog[];

  // Actions - Notification Rules
  setNotificationRule: (rule: Omit<NotificationRule, "id">) => void;
  toggleNotificationRule: (integrationId: string, eventType: string) => void;
  getNotificationRules: (integrationId: string) => NotificationRule[];

  // Actions - API Keys
  createApiKey: (name: string, scopes: string[]) => { key: ApiKey; fullKey: string };
  revokeApiKey: (id: string) => void;

  // Actions - Webhooks
  createWebhook: (url: string, events: string[]) => OutgoingWebhook;
  updateWebhook: (id: string, updates: Partial<Pick<OutgoingWebhook, "url" | "events" | "enabled">>) => void;
  deleteWebhook: (id: string) => void;
}

function generateId() {
  return crypto.randomUUID();
}

function generateApiKeyString() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "qeem_";
  for (let i = 0; i < 40; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const useIntegrationsStore = create<IntegrationsState>()(
  persist(
    (set, get) => ({
      integrations: MOCK_INTEGRATIONS,
      syncLogs: MOCK_SYNC_LOGS,
      notificationRules: [],
      apiKeys: MOCK_API_KEYS,
      webhooks: MOCK_WEBHOOKS,
      webhookDeliveries: [],

      // Integration CRUD
      connectIntegration: (provider, category, config = {}) => {
        const integration: Integration = {
          id: generateId(),
          workspace_id: "current",
          provider,
          category,
          status: "connected",
          config,
          last_sync_at: null,
          sync_frequency: "daily",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((s) => ({
          integrations: [...s.integrations.filter((i) => i.provider !== provider), integration],
        }));
        return integration;
      },

      disconnectIntegration: (id) => {
        set((s) => ({
          integrations: s.integrations.filter((i) => i.id !== id),
          notificationRules: s.notificationRules.filter((r) => r.integration_id !== id),
        }));
      },

      updateIntegrationStatus: (id, status) => {
        set((s) => ({
          integrations: s.integrations.map((i) =>
            i.id === id ? { ...i, status, updated_at: new Date().toISOString() } : i
          ),
        }));
      },

      updateIntegrationConfig: (id, config) => {
        set((s) => ({
          integrations: s.integrations.map((i) =>
            i.id === id ? { ...i, config: { ...i.config, ...config }, updated_at: new Date().toISOString() } : i
          ),
        }));
      },

      updateSyncFrequency: (id, frequency) => {
        set((s) => ({
          integrations: s.integrations.map((i) =>
            i.id === id ? { ...i, sync_frequency: frequency, updated_at: new Date().toISOString() } : i
          ),
        }));
      },

      getIntegration: (provider) => {
        return get().integrations.find((i) => i.provider === provider);
      },

      // Sync Logs
      addSyncLog: (log) => {
        const entry: IntegrationSyncLog = { ...log, id: generateId() };
        set((s) => ({ syncLogs: [entry, ...s.syncLogs].slice(0, 100) }));
      },

      getSyncLogs: (integrationId) => {
        return get().syncLogs.filter((l) => l.integration_id === integrationId);
      },

      // Notification Rules
      setNotificationRule: (rule) => {
        const existing = get().notificationRules.find(
          (r) => r.integration_id === rule.integration_id && r.event_type === rule.event_type
        );
        if (existing) {
          set((s) => ({
            notificationRules: s.notificationRules.map((r) =>
              r.id === existing.id ? { ...r, ...rule } : r
            ),
          }));
        } else {
          set((s) => ({
            notificationRules: [...s.notificationRules, { ...rule, id: generateId() }],
          }));
        }
      },

      toggleNotificationRule: (integrationId, eventType) => {
        const existing = get().notificationRules.find(
          (r) => r.integration_id === integrationId && r.event_type === eventType
        );
        if (existing) {
          set((s) => ({
            notificationRules: s.notificationRules.map((r) =>
              r.id === existing.id ? { ...r, enabled: !r.enabled } : r
            ),
          }));
        } else {
          set((s) => ({
            notificationRules: [
              ...s.notificationRules,
              {
                id: generateId(),
                workspace_id: "current",
                integration_id: integrationId,
                event_type: eventType,
                channel: null,
                enabled: true,
                config: {},
              },
            ],
          }));
        }
      },

      getNotificationRules: (integrationId) => {
        return get().notificationRules.filter((r) => r.integration_id === integrationId);
      },

      // API Keys
      createApiKey: (name, scopes) => {
        const fullKey = generateApiKeyString();
        const key: ApiKey = {
          id: generateId(),
          workspace_id: "current",
          name,
          key_prefix: fullKey.slice(0, 13) + "...",
          scopes,
          last_used_at: null,
          expires_at: null,
          revoked_at: null,
          created_by: "current",
          created_at: new Date().toISOString(),
        };
        set((s) => ({ apiKeys: [...s.apiKeys, key] }));
        return { key, fullKey };
      },

      revokeApiKey: (id) => {
        set((s) => ({
          apiKeys: s.apiKeys.map((k) =>
            k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k
          ),
        }));
      },

      // Webhooks
      createWebhook: (url, events) => {
        const webhook: OutgoingWebhook = {
          id: generateId(),
          workspace_id: "current",
          url,
          events,
          enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((s) => ({ webhooks: [...s.webhooks, webhook] }));
        return webhook;
      },

      updateWebhook: (id, updates) => {
        set((s) => ({
          webhooks: s.webhooks.map((w) =>
            w.id === id ? { ...w, ...updates, updated_at: new Date().toISOString() } : w
          ),
        }));
      },

      deleteWebhook: (id) => {
        set((s) => ({
          webhooks: s.webhooks.filter((w) => w.id !== id),
          webhookDeliveries: s.webhookDeliveries.filter((d) => d.webhook_id !== id),
        }));
      },
    }),
    {
      name: "qeemly:integrations",
    }
  )
);
