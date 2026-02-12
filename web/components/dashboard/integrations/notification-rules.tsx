"use client";

import clsx from "clsx";
import { Bell, BellOff } from "lucide-react";
import { useIntegrationsStore } from "@/lib/integrations/store";
import { NOTIFICATION_EVENTS } from "@/lib/integrations/types";

type Props = {
  integrationId: string;
};

export function NotificationRules({ integrationId }: Props) {
  const store = useIntegrationsStore();
  const rules = store.getNotificationRules(integrationId);

  const isEventEnabled = (eventType: string) => {
    const rule = rules.find((r) => r.event_type === eventType);
    if (!rule) {
      // Check default
      const event = NOTIFICATION_EVENTS.find((e) => e.id === eventType);
      return event?.defaultEnabled ?? false;
    }
    return rule.enabled;
  };

  const handleToggle = (eventType: string) => {
    store.toggleNotificationRule(integrationId, eventType);
  };

  return (
    <div className="space-y-1">
      <p className="text-xs text-brand-600/70 mb-4">
        Choose which events trigger notifications through this integration.
      </p>

      <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
        {NOTIFICATION_EVENTS.map((event) => {
          const enabled = isEventEnabled(event.id);
          return (
            <div
              key={event.id}
              className={clsx(
                "flex items-center justify-between gap-4 px-4 py-3 transition-colors",
                enabled ? "bg-white" : "bg-brand-50/30"
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {enabled ? (
                    <Bell className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                  ) : (
                    <BellOff className="h-3.5 w-3.5 text-brand-300 shrink-0" />
                  )}
                  <span
                    className={clsx(
                      "text-sm font-medium",
                      enabled ? "text-brand-900" : "text-brand-500"
                    )}
                  >
                    {event.label}
                  </span>
                </div>
                <p className="mt-0.5 ml-5.5 text-[11px] text-brand-500/70 leading-relaxed">
                  {event.description}
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() => handleToggle(event.id)}
                className={clsx(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
                  enabled ? "bg-brand-500" : "bg-brand-200"
                )}
              >
                <span
                  className={clsx(
                    "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                    enabled ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
