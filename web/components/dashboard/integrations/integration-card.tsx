"use client";

import clsx from "clsx";
import {
  Check,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Clock,
  Plug,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { IntegrationProvider, IntegrationStatus } from "@/lib/integrations/types";
import { ProviderLogo } from "./provider-logos";

type IntegrationCardProps = {
  provider: IntegrationProvider;
  status?: IntegrationStatus;
  lastSyncAt?: string | null;
  onConnect?: () => void;
  onManage?: () => void;
  onDisconnect?: () => void;
};

const STATUS_CONFIG: Record<
  IntegrationStatus,
  { label: string; color: string; icon: typeof Check }
> = {
  connected: { label: "Connected", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: Check },
  disconnected: { label: "Not connected", color: "text-brand-500 bg-brand-50 border-brand-200", icon: Plug },
  error: { label: "Error", color: "text-red-600 bg-red-50 border-red-200", icon: AlertTriangle },
  syncing: { label: "Syncing...", color: "text-amber-600 bg-amber-50 border-amber-200", icon: RefreshCw },
};

function formatLastSync(dateString: string | null | undefined) {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function IntegrationCard({
  provider,
  status = "disconnected",
  lastSyncAt,
  onConnect,
  onManage,
  onDisconnect,
}: IntegrationCardProps) {
  const isConnected = status === "connected" || status === "syncing";
  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;
  const lastSyncLabel = formatLastSync(lastSyncAt);

  return (
    <div
      className={clsx(
        "group relative flex flex-col rounded-2xl border bg-white p-5 transition-all duration-200",
        provider.comingSoon
          ? "border-border/50 opacity-70"
          : "border-border hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:-translate-y-0.5",
        isConnected && "border-emerald-200/60 bg-emerald-50/20"
      )}
    >
      {/* Header: Logo + Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Provider Logo */}
          <ProviderLogo id={provider.id} size={44} />

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-brand-900 truncate">
              {provider.name}
            </h3>
            {provider.mergeIntegration && (
              <span className="text-[10px] font-medium text-brand-500 uppercase tracking-wider">
                via Merge
              </span>
            )}
          </div>
        </div>

        {/* Status Badge */}
        {!provider.comingSoon && (
          <span
            className={clsx(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              statusConfig.color
            )}
          >
            <StatusIcon className={clsx("h-3 w-3", status === "syncing" && "animate-spin")} />
            {statusConfig.label}
          </span>
        )}

        {provider.comingSoon && (
          <Badge variant="muted" className="text-[10px] px-2 py-0.5">
            Coming Soon
          </Badge>
        )}
      </div>

      {/* Description */}
      <p className="mt-3 text-xs leading-relaxed text-brand-700/70 line-clamp-2">
        {provider.description}
      </p>

      {/* Features */}
      <div className="mt-3 flex flex-wrap gap-1">
        {provider.features.slice(0, 3).map((feature) => (
          <span
            key={feature}
            className="inline-block rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-600"
          >
            {feature.replace(/_/g, " ")}
          </span>
        ))}
      </div>

      {/* Last Sync */}
      {isConnected && lastSyncLabel && (
        <div className="mt-3 flex items-center gap-1 text-[11px] text-brand-600/70">
          <Clock className="h-3 w-3" />
          <span>Last sync: {lastSyncLabel}</span>
        </div>
      )}

      {/* Action Button */}
      <div className="mt-4 flex items-center gap-2">
        {provider.comingSoon ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs opacity-50 cursor-not-allowed"
            disabled
          >
            Coming Soon
          </Button>
        ) : isConnected ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs"
              onClick={onManage}
            >
              Manage
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={onDisconnect}
            >
              Disconnect
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            size="sm"
            className="w-full text-xs"
            onClick={onConnect}
          >
            <Plug className="mr-1.5 h-3.5 w-3.5" />
            Connect
          </Button>
        )}
      </div>

      {/* External link */}
      {provider.docsUrl && !provider.comingSoon && (
        <a
          href={provider.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ExternalLink className="h-3.5 w-3.5 text-brand-400 hover:text-brand-600" />
        </a>
      )}
    </div>
  );
}
