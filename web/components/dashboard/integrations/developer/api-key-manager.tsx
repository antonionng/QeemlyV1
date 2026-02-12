"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  Clock,
  Shield,
  AlertTriangle,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useIntegrationsStore } from "@/lib/integrations/store";
import { API_SCOPES } from "@/lib/integrations/types";

export function ApiKeyManager() {
  const store = useIntegrationsStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["employees:read"]);
  const [createdFullKey, setCreatedFullKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeKeys = store.apiKeys.filter((k) => !k.revoked_at);
  const revokedKeys = store.apiKeys.filter((k) => k.revoked_at);

  const handleCreate = () => {
    if (!newKeyName.trim()) return;
    const { key, fullKey } = store.createApiKey(newKeyName.trim(), newKeyScopes);
    setCreatedFullKey(fullKey);
    setNewKeyName("");
    setNewKeyScopes(["employees:read"]);
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = (id: string) => {
    if (window.confirm("Are you sure you want to revoke this API key? This cannot be undone.")) {
      store.revokeApiKey(id);
    }
  };

  const toggleScope = (scope: string) => {
    setNewKeyScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-brand-900">API Keys</h3>
          <p className="mt-0.5 text-xs text-brand-500">
            Create and manage API keys for programmatic access to Qeemly.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setShowCreateModal(true);
            setCreatedFullKey(null);
          }}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Create Key
        </Button>
      </div>

      {/* Newly Created Key Banner */}
      {createdFullKey && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900">
                Save your API key now
              </p>
              <p className="mt-1 text-xs text-amber-700">
                This is the only time the full key will be shown. Copy it to a secure location.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 min-w-0 truncate rounded-lg bg-white border border-amber-200 px-3 py-2 text-xs font-mono text-brand-900">
                  {createdFullKey}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(createdFullKey, "new-key")}
                >
                  {copiedId === "new-key" ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <button
              onClick={() => setCreatedFullKey(null)}
              className="shrink-0 text-amber-400 hover:text-amber-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Active Keys */}
      {activeKeys.length === 0 && !createdFullKey ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
          <Key className="h-8 w-8 text-brand-200" />
          <p className="mt-3 text-sm text-brand-600">No API keys yet</p>
          <p className="mt-1 text-xs text-brand-400">
            Create an API key to start integrating with Qeemly programmatically.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {activeKeys.map((key) => (
            <div key={key.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Key className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                  <span className="text-sm font-medium text-brand-900 truncate">
                    {key.name}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <code className="text-[11px] font-mono text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded">
                    {key.key_prefix}
                  </code>
                  {key.scopes.slice(0, 3).map((scope) => (
                    <span
                      key={scope}
                      className="text-[10px] text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded"
                    >
                      {scope}
                    </span>
                  ))}
                  {key.scopes.length > 3 && (
                    <span className="text-[10px] text-brand-400">
                      +{key.scopes.length - 3} more
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-3 text-[10px] text-brand-400">
                  <span>Created {new Date(key.created_at).toLocaleDateString()}</span>
                  {key.last_used_at && (
                    <span>Last used {new Date(key.last_used_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                onClick={() => handleRevoke(key.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Revoked Keys (collapsed) */}
      {revokedKeys.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs font-medium text-brand-400 hover:text-brand-600">
            {revokedKeys.length} revoked key{revokedKeys.length > 1 ? "s" : ""}
          </summary>
          <div className="mt-2 divide-y divide-border rounded-xl border border-border overflow-hidden opacity-60">
            {revokedKeys.map((key) => (
              <div key={key.id} className="flex items-center gap-3 px-4 py-3 bg-brand-50/30">
                <Key className="h-3.5 w-3.5 text-brand-300 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-sm text-brand-500 line-through">{key.name}</span>
                  <span className="ml-2 text-[10px] text-red-400">
                    Revoked {key.revoked_at ? new Date(key.revoked_at).toLocaleDateString() : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Create Key Modal */}
      {showCreateModal && (
        <CreateKeyModal
          name={newKeyName}
          scopes={newKeyScopes}
          onNameChange={setNewKeyName}
          onToggleScope={toggleScope}
          onCreate={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

// ============================================================================
// Create Key Modal (inline)
// ============================================================================

function CreateKeyModal({
  name,
  scopes,
  onNameChange,
  onToggleScope,
  onCreate,
  onClose,
}: {
  name: string;
  scopes: string[];
  onNameChange: (v: string) => void;
  onToggleScope: (scope: string) => void;
  onCreate: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-brand-900">Create API Key</h3>
          <button onClick={onClose} className="text-brand-400 hover:text-brand-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-brand-700 mb-1.5">
              Key Name
            </label>
            <Input
              placeholder="e.g. Production Key"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
            />
          </div>

          {/* Scopes */}
          <div>
            <label className="block text-xs font-semibold text-brand-700 mb-1.5">
              Permissions
            </label>
            <div className="space-y-1.5">
              {API_SCOPES.map((scope) => (
                <label
                  key={scope.id}
                  className={clsx(
                    "flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors",
                    scopes.includes(scope.id)
                      ? "border-brand-500 bg-brand-50"
                      : "border-border hover:bg-brand-50/50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={scopes.includes(scope.id)}
                    onChange={() => onToggleScope(scope.id)}
                    className="h-4 w-4 rounded border-brand-300 text-brand-500 focus:ring-brand-400"
                  />
                  <div>
                    <span className="text-xs font-medium text-brand-900">{scope.label}</span>
                    <span className="ml-1.5 text-[10px] text-brand-400">{scope.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onCreate();
              onClose();
            }}
            disabled={!name.trim() || scopes.length === 0}
          >
            Create Key
          </Button>
        </div>
      </div>
    </div>
  );
}
