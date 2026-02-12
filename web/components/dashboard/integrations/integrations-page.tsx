"use client";

import { useState } from "react";
import {
  Bell,
  Users,
  Briefcase,
  Code2,
  Search,
  Filter,
} from "lucide-react";
import clsx from "clsx";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

type Tab = "all" | "notification" | "hris" | "ats" | "developer";

const TABS: { id: Tab; label: string; icon: typeof Bell }[] = [
  { id: "all", label: "All", icon: Filter },
  { id: "notification", label: "Notifications", icon: Bell },
  { id: "hris", label: "HRIS", icon: Users },
  { id: "ats", label: "ATS", icon: Briefcase },
  { id: "developer", label: "Developer", icon: Code2 },
];

export function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const store = useIntegrationsStore();
  const notificationProviders = getNotificationProviders();
  const hrisProviders = getHrisProviders();
  const atsProviders = getAtsProviders();

  // Filter providers by search
  const filterBySearch = (providers: IntegrationProvider[]) => {
    if (!searchQuery) return providers;
    const q = searchQuery.toLowerCase();
    return providers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  };

  const handleConnect = (provider: IntegrationProvider) => {
    // In production: initiate OAuth or Merge Link flow
    // For now, simulate connection
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
    const filtered = filterBySearch(providers);
    if (filtered.length === 0) return null;
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((provider) => {
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

  const renderCategorySection = (
    categoryKey: string,
    providers: IntegrationProvider[],
    subsections?: { label: string; providers: IntegrationProvider[] }[]
  ) => {
    const category = CATEGORY_LABELS[categoryKey];
    if (!category) return null;

    const filtered = subsections
      ? subsections.some((s) => filterBySearch(s.providers).length > 0)
      : filterBySearch(providers).length > 0;

    if (!filtered) return null;

    return (
      <section key={categoryKey} className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-brand-900">{category.label}</h2>
          <p className="text-sm text-brand-600/70 mt-0.5">{category.description}</p>
        </div>

        {subsections ? (
          <div className="space-y-6">
            {subsections.map((sub) => {
              const subFiltered = filterBySearch(sub.providers);
              if (subFiltered.length === 0) return null;
              return (
                <div key={sub.label}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-500 mb-3">
                    {sub.label}
                  </h3>
                  {renderProviderGrid(sub.providers)}
                </div>
              );
            })}
          </div>
        ) : (
          renderProviderGrid(providers)
        )}
      </section>
    );
  };

  const connectedCount = store.integrations.filter((i) => i.status === "connected").length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Integrations</h1>
        <p className="mt-1 text-sm text-brand-600/70">
          Connect your HRIS, ATS, and notification tools to keep Qeemly in sync.
          {connectedCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              {connectedCount} connected
            </span>
          )}
        </p>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-brand-50 p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-white text-brand-900 shadow-sm"
                    : "text-brand-600 hover:text-brand-800"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
          <Input
            type="text"
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-10">
        {/* Notifications */}
        {(activeTab === "all" || activeTab === "notification") &&
          renderCategorySection("notification", notificationProviders)}

        {/* HRIS */}
        {(activeTab === "all" || activeTab === "hris") &&
          renderCategorySection("hris", [], [
            { label: "Global HRIS (50+ supported via Merge)", providers: hrisProviders.global },
            { label: "GCC / MENA Native", providers: hrisProviders.gcc },
            { label: "Manual / Fallback", providers: hrisProviders.manual },
          ])}

        {/* ATS */}
        {(activeTab === "all" || activeTab === "ats") &&
          renderCategorySection("ats", atsProviders)}

        {/* Developer Hub */}
        {(activeTab === "all" || activeTab === "developer") && (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-brand-900">
                {CATEGORY_LABELS.developer.label}
              </h2>
              <p className="text-sm text-brand-600/70 mt-0.5">
                {CATEGORY_LABELS.developer.description}
              </p>
            </div>
            <DeveloperHub />
          </section>
        )}

        {/* Empty state */}
        {searchQuery && (
          <div className="text-center py-12">
            <Search className="mx-auto h-8 w-8 text-brand-300" />
            <p className="mt-3 text-sm text-brand-600">
              No integrations found for &quot;{searchQuery}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
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
