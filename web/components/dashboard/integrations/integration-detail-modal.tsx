"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import {
  X,
  Clock,
  RefreshCw,
  Settings,
  Bell,
  Activity,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationRules } from "./notification-rules";
import { SyncStatus } from "./sync-status";
import { useIntegrationsStore } from "@/lib/integrations/store";
import { ProviderLogo } from "./provider-logos";
import type { IntegrationProvider, SyncFrequency } from "@/lib/integrations/types";

type Props = {
  provider: IntegrationProvider;
  onClose: () => void;
};

type DetailTab = "overview" | "notifications" | "sync_log";

const SYNC_FREQUENCIES: { value: SyncFrequency; label: string }[] = [
  { value: "realtime", label: "Real-time (webhooks)" },
  { value: "hourly", label: "Every hour" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "manual", label: "Manual only" },
];

export function IntegrationDetailModal({ provider, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

  const store = useIntegrationsStore();
  const integration = store.getIntegration(provider.id);

  // Body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Focus trap
  useEffect(() => {
    const id = window.setTimeout(() => panelRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, []);

  if (!integration) return null;

  const isNotification = provider.category === "notification";
  const tabs: { id: DetailTab; label: string; icon: typeof Settings }[] = [
    { id: "overview", label: "Overview", icon: Settings },
    ...(isNotification
      ? [{ id: "notifications" as DetailTab, label: "Event Rules", icon: Bell }]
      : []),
    ...(!isNotification
      ? [{ id: "sync_log" as DetailTab, label: "Sync Log", icon: Activity }]
      : []),
  ];

  const handleSyncNow = () => {
    store.updateIntegrationStatus(integration.id, "syncing");
    // Simulate sync
    setTimeout(() => {
      store.updateIntegrationStatus(integration.id, "connected");
      store.addSyncLog({
        integration_id: integration.id,
        sync_type: "full",
        status: "success",
        records_created: Math.floor(Math.random() * 10),
        records_updated: Math.floor(Math.random() * 50),
        records_failed: 0,
        error_message: null,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });
    }, 2000);
  };

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-[fadeIn_180ms_ease-out]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          ref={panelRef}
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-white shadow-[0_20px_70px_rgba(15,23,42,0.18)] outline-none animate-[popIn_200ms_cubic-bezier(0.2,0.8,0.2,1)]"
        >
          {/* Top accent */}
          <div className="h-1.5 bg-brand-500" />

          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <ProviderLogo id={provider.id} size={48} />
                <div>
                  <h3 className="text-xl font-bold text-brand-900">{provider.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                      <Check className="h-3 w-3" />
                      Connected
                    </span>
                    {integration.last_sync_at && (
                      <span className="text-[11px] text-brand-500">
                        Last sync: {new Date(integration.last_sync_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-600 hover:bg-muted hover:text-brand-900"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-6 flex items-center gap-1 border-b border-border pb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={clsx(
                      "flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-medium transition-colors",
                      activeTab === tab.id
                        ? "border-b-2 border-brand-500 text-brand-900"
                        : "text-brand-500 hover:text-brand-700"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="mt-6 max-h-[50vh] overflow-y-auto">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Description */}
                  <p className="text-sm text-brand-700/80">{provider.description}</p>

                  {/* Sync Frequency (for HRIS/ATS) */}
                  {!isNotification && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-brand-800 uppercase tracking-wider">
                        Sync Frequency
                      </label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {SYNC_FREQUENCIES.map((freq) => (
                          <button
                            key={freq.value}
                            onClick={() => store.updateSyncFrequency(integration.id, freq.value)}
                            className={clsx(
                              "rounded-xl border px-3 py-2 text-xs font-medium transition-all",
                              integration.sync_frequency === freq.value
                                ? "border-brand-500 bg-brand-50 text-brand-900"
                                : "border-border text-brand-600 hover:border-brand-300"
                            )}
                          >
                            {freq.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-brand-800 uppercase tracking-wider">
                      Capabilities
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {provider.features.map((f) => (
                        <Badge key={f} variant="outline" className="text-xs">
                          {f.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  {!isNotification && (
                    <div className="flex items-center gap-3 pt-2 border-t border-border">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSyncNow}
                        isLoading={integration.status === "syncing"}
                      >
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        Sync Now
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          store.disconnectIntegration(integration.id);
                          onClose();
                        }}
                      >
                        Disconnect
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "notifications" && (
                <NotificationRules integrationId={integration.id} />
              )}

              {activeTab === "sync_log" && (
                <SyncStatus integrationId={integration.id} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
