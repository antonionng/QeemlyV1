"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Users,
  Briefcase,
  Code2,
  Search,
  Filter,
  BarChart3,
  CheckCircle2,
  Layers,
  Zap,
} from "lucide-react";
import clsx from "clsx";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IntegrationCard } from "./integration-card";
import { IntegrationDetailModal } from "./integration-detail-modal";
import { DeveloperHub } from "./developer/developer-hub";
import {
  getNotificationProviders,
  getHrisProviders,
  getAtsProviders,
  CATEGORY_LABELS,
} from "@/lib/integrations/providers";
import { useIntegrationsStore } from "@/lib/integrations/store";
import type { IntegrationProvider } from "@/lib/integrations/types";

type Tab = "all" | "notification" | "hris" | "ats" | "benchmarks" | "developer";

const TABS: { id: Tab; label: string; icon: typeof Bell }[] = [
  { id: "all", label: "All", icon: Filter },
  { id: "notification", label: "Notifications", icon: Bell },
  { id: "hris", label: "HRIS", icon: Users },
  { id: "ats", label: "ATS", icon: Briefcase },
  { id: "benchmarks", label: "Benchmarks", icon: BarChart3 },
  { id: "developer", label: "Developer", icon: Code2 },
];

export function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const store = useIntegrationsStore();
  const loadFromApi = useIntegrationsStore((state) => state.loadFromApi);
  useEffect(() => {
    void loadFromApi();
  }, [loadFromApi]);
  const notificationProviders = getNotificationProviders();
  const hrisProviders = getHrisProviders();
  const atsProviders = getAtsProviders();
  const allProviders = [
    ...notificationProviders,
    ...hrisProviders.global,
    ...hrisProviders.gcc,
    ...hrisProviders.manual,
    ...atsProviders,
  ];

  const query = searchQuery.trim().toLowerCase();

  const filterBySearch = (providers: IntegrationProvider[]) =>
    providers.filter((provider) => {
      if (!query) return true;
      return (
        provider.name.toLowerCase().includes(query) ||
        provider.description.toLowerCase().includes(query) ||
        provider.features.some((feature) => feature.toLowerCase().includes(query))
      );
    });

  const filteredNotificationProviders = filterBySearch(notificationProviders);
  const filteredGlobalHrisProviders = filterBySearch(hrisProviders.global);
  const filteredGccHrisProviders = filterBySearch(hrisProviders.gcc);
  const filteredManualHrisProviders = filterBySearch(hrisProviders.manual);
  const filteredAtsProviders = filterBySearch(atsProviders);

  const handleConnect = (provider: IntegrationProvider) => {
    store.connectIntegration(provider.id, provider.category as "notification" | "hris" | "ats");
  };

  const handleManage = (provider: IntegrationProvider) => {
    setSelectedProvider(provider);
    setShowDetailModal(true);
  };

  const handleDisconnect = (provider: IntegrationProvider) => {
    const integration = store.getIntegration(provider.id);
    if (integration) {
      store.disconnectIntegration(integration.id);
    }
  };

  const renderProviderGrid = (providers: IntegrationProvider[]) => {
    if (providers.length === 0) return null;

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => {
          const integration = store.getIntegration(provider.id);
          return (
            <IntegrationCard
              key={provider.id}
              provider={provider}
              status={integration?.status}
              lastSyncAt={integration?.last_sync_at}
              onConnect={() => handleConnect(provider)}
              onManage={() => handleManage(provider)}
              onDisconnect={() => handleDisconnect(provider)}
            />
          );
        })}
      </div>
    );
  };

  const keywordMatches = (terms: string[]) =>
    !query || terms.some((term) => term.toLowerCase().includes(query));

  const showNotificationSection =
    (activeTab === "all" || activeTab === "notification") &&
    filteredNotificationProviders.length > 0;
  const showHrisSection =
    (activeTab === "all" || activeTab === "hris") &&
    (filteredGlobalHrisProviders.length > 0 ||
      filteredGccHrisProviders.length > 0 ||
      filteredManualHrisProviders.length > 0);
  const showAtsSection =
    (activeTab === "all" || activeTab === "ats") &&
    filteredAtsProviders.length > 0;
  const showBenchmarksSection =
    (activeTab === "all" || activeTab === "benchmarks") &&
    keywordMatches(["salary benchmark", "market data", "benchmark upload", "benchmark api"]);
  const showDeveloperSection =
    (activeTab === "all" || activeTab === "developer") &&
    keywordMatches(["developer", "api", "webhook", "custom integration"]);

  const hasVisibleResults =
    showNotificationSection ||
    showHrisSection ||
    showAtsSection ||
    showBenchmarksSection ||
    showDeveloperSection;

  const connectedCount = store.integrations.filter((integration) => integration.status === "connected").length;
  const comingSoonCount = allProviders.filter((provider) => provider.comingSoon).length;
  const mergePoweredCount = allProviders.filter((provider) => provider.connectionMethod === "merge_link").length;

  const filterButtonClass = (tab: Tab) =>
    clsx(
      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
      activeTab === tab
        ? "bg-brand-500 text-white"
        : "bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text-primary"
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-text-primary">Integrations</h1>
          <p className="mt-1 max-w-3xl text-sm text-text-secondary">
            Connect communication tools, HR systems, ATS platforms, and custom APIs to keep compensation data in sync.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setActiveTab("developer")}>
            Open API docs
          </Button>
          <Button variant="primary" size="sm">
            + New key
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Connected
          </div>
          <p className="mt-2 text-2xl font-semibold text-text-primary">{connectedCount}</p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
            <Layers className="h-4 w-4 text-brand-500" />
            Available connectors
          </div>
          <p className="mt-2 text-2xl font-semibold text-text-primary">
            {allProviders.length - comingSoonCount}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
            <Zap className="h-4 w-4 text-amber-500" />
            Merge-powered
          </div>
          <p className="mt-2 text-2xl font-semibold text-text-primary">{mergePoweredCount}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-4">
        <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-lg">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              type="text"
              placeholder="Search integrations"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={filterButtonClass(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-10">
        {showNotificationSection && (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">{CATEGORY_LABELS.notification.label}</h2>
              <p className="mt-0.5 text-sm text-text-secondary">
                {CATEGORY_LABELS.notification.description}
              </p>
            </div>
            {renderProviderGrid(filteredNotificationProviders)}
          </section>
        )}

        {showHrisSection && (
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">{CATEGORY_LABELS.hris.label}</h2>
              <p className="mt-0.5 text-sm text-text-secondary">{CATEGORY_LABELS.hris.description}</p>
            </div>

            {filteredGlobalHrisProviders.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Global HRIS (via Merge.dev)
                </h3>
                {renderProviderGrid(filteredGlobalHrisProviders)}
              </div>
            )}

            {filteredGccHrisProviders.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  GCC / MENA native
                </h3>
                {renderProviderGrid(filteredGccHrisProviders)}
              </div>
            )}

            {filteredManualHrisProviders.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Manual and fallback
                </h3>
                {renderProviderGrid(filteredManualHrisProviders)}
              </div>
            )}
          </section>
        )}

        {showBenchmarksSection && (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">{CATEGORY_LABELS.benchmarks.label}</h2>
              <p className="mt-0.5 text-sm text-text-secondary">
                {CATEGORY_LABELS.benchmarks.description}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 font-bold text-sm">
                    Q
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Qeemly Market Data</p>
                    <span className="text-xs text-emerald-600">Active</span>
                  </div>
                </div>
                <p className="text-xs text-text-secondary">
                  Built-in GCC benchmark datasets refreshed continuously for role and location analysis.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-accent-700 font-bold text-xs">
                    CSV
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Benchmark Upload</p>
                    <span className="text-xs text-emerald-600">Available</span>
                  </div>
                </div>
                <p className="text-xs text-text-secondary">
                  Upload purchased salary surveys and custom benchmark files using CSV or XLSX formats.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-accent-700 font-bold text-xs">
                    API
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Benchmark API</p>
                    <span className="text-xs text-emerald-600">Available</span>
                  </div>
                </div>
                <p className="text-xs text-text-secondary">
                  Push benchmark records via API with scoped write permissions for automated pipelines.
                </p>
              </div>
            </div>
          </section>
        )}

        {showAtsSection && (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">{CATEGORY_LABELS.ats.label}</h2>
              <p className="mt-0.5 text-sm text-text-secondary">{CATEGORY_LABELS.ats.description}</p>
            </div>
            {renderProviderGrid(filteredAtsProviders)}
          </section>
        )}

        {showDeveloperSection && (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">{CATEGORY_LABELS.developer.label}</h2>
              <p className="mt-0.5 text-sm text-text-secondary">
                {CATEGORY_LABELS.developer.description}
              </p>
            </div>
            <DeveloperHub />
          </section>
        )}

        {!hasVisibleResults && (
          <div className="rounded-2xl border border-dashed border-border bg-surface-1 py-12 text-center">
            <Search className="mx-auto h-8 w-8 text-text-muted" />
            <p className="mt-3 text-sm text-text-secondary">
              No integrations found for &quot;{searchQuery}&quot;.
            </p>
          </div>
        )}
      </div>

      {showDetailModal && selectedProvider && (
        <IntegrationDetailModal
          provider={selectedProvider}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedProvider(null);
          }}
        />
      )}
    </div>
  );
}
