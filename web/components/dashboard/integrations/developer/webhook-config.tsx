"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  Webhook,
  Plus,
  Trash2,
  Check,
  X,
  ExternalLink,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIntegrationsStore } from "@/lib/integrations/store";
import { NOTIFICATION_EVENTS } from "@/lib/integrations/types";

export function WebhookConfig() {
  const store = useIntegrationsStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const handleCreate = () => {
    if (!newUrl.trim() || selectedEvents.length === 0) return;
    store.createWebhook(newUrl.trim(), selectedEvents);
    setNewUrl("");
    setSelectedEvents([]);
    setShowAddForm(false);
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
    );
  };

  const toggleWebhookEnabled = (id: string, currentEnabled: boolean) => {
    store.updateWebhook(id, { enabled: !currentEnabled });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-brand-900">Outgoing Webhooks</h3>
          <p className="mt-0.5 text-xs text-brand-500">
            Qeemly will send HTTP POST requests to your URL when events occur.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add Webhook
        </Button>
      </div>

      {/* Add Webhook Form */}
      {showAddForm && (
        <div className="rounded-xl border border-brand-200 bg-brand-50/30 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-brand-900">New Webhook</h4>
            <button onClick={() => setShowAddForm(false)} className="text-brand-400 hover:text-brand-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs font-semibold text-brand-700 mb-1.5">
              Endpoint URL
            </label>
            <Input
              placeholder="https://your-server.com/webhook"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
            />
          </div>

          {/* Events */}
          <div>
            <label className="block text-xs font-semibold text-brand-700 mb-1.5">
              Events to subscribe
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {NOTIFICATION_EVENTS.map((event) => (
                <label
                  key={event.id}
                  className={clsx(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors text-xs",
                    selectedEvents.includes(event.id)
                      ? "border-brand-500 bg-brand-50"
                      : "border-border hover:bg-brand-50/50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(event.id)}
                    onChange={() => toggleEvent(event.id)}
                    className="h-3.5 w-3.5 rounded border-brand-300 text-brand-500 focus:ring-brand-400"
                  />
                  <span className="text-brand-800">{event.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreate}
              disabled={!newUrl.trim() || selectedEvents.length === 0}
            >
              Create Webhook
            </Button>
          </div>
        </div>
      )}

      {/* Webhook List */}
      {store.webhooks.length === 0 && !showAddForm ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
          <Webhook className="h-8 w-8 text-brand-200" />
          <p className="mt-3 text-sm text-brand-600">No webhooks configured</p>
          <p className="mt-1 text-xs text-brand-400">
            Set up outgoing webhooks to get notified about events in real-time.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {store.webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className={clsx(
                "rounded-xl border p-4 transition-colors",
                webhook.enabled ? "border-border bg-white" : "border-border/50 bg-brand-50/30 opacity-60"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Webhook className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                    <code className="text-xs font-mono text-brand-800 truncate">
                      {webhook.url}
                    </code>
                  </div>

                  {/* Event Badges */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {webhook.events.map((eventId) => {
                      const event = NOTIFICATION_EVENTS.find((e) => e.id === eventId);
                      return (
                        <span
                          key={eventId}
                          className="inline-block rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-600"
                        >
                          {event?.label ?? eventId}
                        </span>
                      );
                    })}
                  </div>

                  <p className="mt-1.5 text-[10px] text-brand-400">
                    Created {new Date(webhook.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Enable/Disable Toggle */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={webhook.enabled}
                    onClick={() => toggleWebhookEnabled(webhook.id, webhook.enabled)}
                    className={clsx(
                      "relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors duration-200",
                      webhook.enabled ? "bg-brand-500" : "bg-brand-200"
                    )}
                  >
                    <span
                      className={clsx(
                        "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200",
                        webhook.enabled ? "translate-x-4.5" : "translate-x-0.5"
                      )}
                    />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => {
                      if (window.confirm("Delete this webhook?")) {
                        store.deleteWebhook(webhook.id);
                      }
                    }}
                    className="text-brand-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Signature Verification Info */}
      <div className="rounded-xl bg-brand-50 p-4">
        <h4 className="text-xs font-semibold text-brand-800 mb-1.5">Signature Verification</h4>
        <p className="text-[11px] text-brand-600 leading-relaxed">
          Each webhook request includes a <code className="px-1 py-0.5 bg-white rounded text-[10px]">X-Qeemly-Signature</code> header 
          containing an HMAC-SHA256 signature of the request body. Verify this against your webhook secret to ensure authenticity.
        </p>
      </div>
    </div>
  );
}
