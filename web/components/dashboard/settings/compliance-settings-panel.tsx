"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2, RefreshCcw, Save, Trash2 } from "lucide-react";
import {
  DEFAULT_COMPLIANCE_SETTINGS,
  DOMAIN_CONFIG,
  type ComplianceDomain,
  type ComplianceSettingsPayload,
  type FieldDef,
} from "@/lib/compliance/settings-schema";

const DOMAIN_DEFS = DOMAIN_CONFIG;

export function ComplianceSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [settings, setSettings] = useState<ComplianceSettingsPayload>({
    ...DEFAULT_COMPLIANCE_SETTINGS,
    risk_weights: { ...DEFAULT_COMPLIANCE_SETTINGS.risk_weights },
  });
  const [integrationSyncCount, setIntegrationSyncCount] = useState(0);
  const [lastIntegrationSync, setLastIntegrationSync] = useState<string | null>(null);
  const [jurisdictionsText, setJurisdictionsText] = useState(
    DEFAULT_COMPLIANCE_SETTINGS.default_jurisdictions.join(", ")
  );

  const [records, setRecords] = useState<Record<ComplianceDomain, Record<string, unknown>[]>>({
    policies: [],
    "regulatory-updates": [],
    deadlines: [],
    "visa-cases": [],
    documents: [],
    "audit-events": [],
  });
  const [drafts, setDrafts] = useState<Record<ComplianceDomain, Record<string, unknown>>>({
    policies: { ...DOMAIN_DEFS.policies.defaults },
    "regulatory-updates": { ...DOMAIN_DEFS["regulatory-updates"].defaults },
    deadlines: { ...DOMAIN_DEFS.deadlines.defaults },
    "visa-cases": { ...DOMAIN_DEFS["visa-cases"].defaults },
    documents: { ...DOMAIN_DEFS.documents.defaults },
    "audit-events": { ...DOMAIN_DEFS["audit-events"].defaults },
  });
  const [editing, setEditing] = useState<{ domain: ComplianceDomain; id: string; payload: Record<string, unknown> } | null>(
    null
  );
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setSettingsError(null);
    setRecordError(null);
    try {
      const settingsRes = await fetch("/api/settings/compliance");
      if (!settingsRes.ok) throw new Error("Failed to load compliance settings");
      const settingsData = await settingsRes.json();
      setSettings(settingsData.settings);
      setJurisdictionsText((settingsData.settings?.default_jurisdictions || []).join(", "));
      setIntegrationSyncCount(Number(settingsData.ingestion?.integration_sync_count || 0));
      setLastIntegrationSync(settingsData.ingestion?.last_integration_success_at || null);

      const domainResults = await Promise.all(
        (Object.values(DOMAIN_DEFS)).map(async (def) => {
          const res = await fetch(`/api/settings/compliance/${def.key}`);
          if (!res.ok) throw new Error(`Failed to load ${def.label}`);
          const data = await res.json();
          return [def.key, data.items || []] as const;
        })
      );
      const next: Record<ComplianceDomain, Record<string, unknown>[]> = {
        policies: [],
        "regulatory-updates": [],
        deadlines: [],
        "visa-cases": [],
        documents: [],
        "audit-events": [],
      };
      for (const [key, items] of domainResults) next[key] = items;
      setRecords(next);
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Failed to load compliance setup");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSettings = async () => {
    setSavingSettings(true);
    setSettingsError(null);
    try {
      const parsedJurisdictions = jurisdictionsText
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      if (parsedJurisdictions.length === 0) {
        throw new Error("At least one default jurisdiction is required");
      }
      const payload: ComplianceSettingsPayload = {
        ...settings,
        default_jurisdictions: parsedJurisdictions,
      };
      const res = await fetch("/api/settings/compliance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to save compliance settings");
      }
      setSettings((prev) => ({ ...prev, is_compliance_configured: true }));
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Failed to save compliance settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const createRecord = async (domain: ComplianceDomain) => {
    setBusyKey(`create-${domain}`);
    setRecordError(null);
    try {
      const payload = drafts[domain];
      const res = await fetch(`/api/settings/compliance/${domain}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Failed to create ${domain}`);
      setDrafts((prev) => ({ ...prev, [domain]: { ...DOMAIN_DEFS[domain].defaults } }));
      if (body.item) {
        setRecords((prev) => ({
          ...prev,
          [domain]: [body.item, ...prev[domain]].slice(0, 200),
        }));
      }
      if (body.refresh_warning) {
        setRecordError(`Record saved, but snapshot refresh failed: ${body.refresh_warning}`);
      }
    } catch (err) {
      setRecordError(err instanceof Error ? err.message : "Invalid record payload");
    } finally {
      setBusyKey(null);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setBusyKey(`edit-${editing.domain}-${editing.id}`);
    setRecordError(null);
    try {
      const payload = editing.payload;
      const res = await fetch(`/api/settings/compliance/${editing.domain}/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to update record");
      if (body.item) {
        setRecords((prev) => ({
          ...prev,
          [editing.domain]: prev[editing.domain].map((item) =>
            String(item.id || "") === editing.id ? body.item : item
          ),
        }));
      }
      if (body.refresh_warning) {
        setRecordError(`Record updated, but snapshot refresh failed: ${body.refresh_warning}`);
      }
      setEditing(null);
    } catch (err) {
      setRecordError(err instanceof Error ? err.message : "Invalid edit payload");
    } finally {
      setBusyKey(null);
    }
  };

  const renderField = (field: FieldDef, value: unknown, onChange: (value: unknown) => void) => {
    if (field.type === "textarea") {
      return (
        <Textarea
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="text-sm"
        />
      );
    }
    if (field.type === "select") {
      return (
        <select
          className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-brand-900"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        >
          {(field.options || []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }
    return (
      <Input
        type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "datetime" ? "datetime-local" : "text"}
        value={
          field.type === "datetime"
            ? String(value ?? "").replace("Z", "").slice(0, 16)
            : String(value ?? "")
        }
        onChange={(e) =>
          onChange(
            field.type === "number"
              ? Number(e.target.value || 0)
              : field.type === "datetime"
              ? e.target.value
                ? new Date(e.target.value).toISOString()
                : ""
              : e.target.value
          )
        }
      />
    );
  };

  const deleteRecord = async (domain: ComplianceDomain, id: string) => {
    setBusyKey(`delete-${domain}-${id}`);
    setRecordError(null);
    try {
      const res = await fetch(`/api/settings/compliance/${domain}/${id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to delete record");
      setRecords((prev) => ({
        ...prev,
        [domain]: prev[domain].filter((item) => String(item.id || "") !== id),
      }));
      if (body.refresh_warning) {
        setRecordError(`Record deleted, but snapshot refresh failed: ${body.refresh_warning}`);
      }
    } catch (err) {
      setRecordError(err instanceof Error ? err.message : "Failed to delete record");
    } finally {
      setBusyKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[280px]">
        <Loader2 className="h-7 w-7 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(settingsError || recordError) && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>{settingsError || recordError}</span>
        </div>
      )}

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-900">Compliance Setup</h2>
            <p className="text-sm text-brand-600">
              Configure source precedence and operational parameters before relying on dashboard insights.
            </p>
          </div>
          <Button variant="outline" onClick={() => void loadAll()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reload
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.prefer_integration_data}
              onChange={(e) => setSettings((p) => ({ ...p, prefer_integration_data: e.target.checked }))}
            />
            Prefer integration data
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.prefer_import_data}
              onChange={(e) => setSettings((p) => ({ ...p, prefer_import_data: e.target.checked }))}
            />
            Prefer import data
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.allow_manual_overrides}
              onChange={(e) => setSettings((p) => ({ ...p, allow_manual_overrides: e.target.checked }))}
            />
            Allow manual overrides
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-brand-700 mb-1">Default Jurisdictions (comma-separated)</label>
            <Input
              value={jurisdictionsText}
              onChange={(e) => setJurisdictionsText(e.target.value)}
            />
          </div>
          <div className="text-xs text-brand-600 rounded-lg border border-border px-3 py-2 bg-brand-50/30">
            Integrations synced: <strong>{integrationSyncCount}</strong>
            <br />
            Last integration success: <strong>{lastIntegrationSync ? new Date(lastIntegrationSync).toLocaleString() : "N/A"}</strong>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-700 mb-1">Visa Lead Time (days)</label>
            <Input
              type="number"
              value={settings.visa_lead_time_days}
              onChange={(e) => setSettings((p) => ({ ...p, visa_lead_time_days: Number(e.target.value || 0) }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-700 mb-1">Deadline SLA (days)</label>
            <Input
              type="number"
              value={settings.deadline_sla_days}
              onChange={(e) => setSettings((p) => ({ ...p, deadline_sla_days: Number(e.target.value || 1) }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-700 mb-1">Document Renewal Threshold (days)</label>
            <Input
              type="number"
              value={settings.document_renewal_threshold_days}
              onChange={(e) =>
                setSettings((p) => ({ ...p, document_renewal_threshold_days: Number(e.target.value || 1) }))
              }
            />
          </div>
        </div>

        <Button onClick={() => void saveSettings()} disabled={savingSettings}>
          {savingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Compliance Setup
        </Button>
      </Card>

      {Object.values(DOMAIN_DEFS).map((domain) => {
        const items = records[domain.key] || [];
        return (
          <Card key={domain.key} className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-brand-900">{domain.label}</h3>
              <span className="text-xs font-medium text-brand-600">{items.length} records</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-700 mb-2">Create {domain.singularLabel}</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {domain.fields.map((field) => (
                  <div key={`${domain.key}-create-${field.key}`}>
                    <label className="block text-xs text-brand-600 mb-1">{field.label}</label>
                    {renderField(
                      field,
                      drafts[domain.key][field.key],
                      (next) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [domain.key]: {
                            ...prev[domain.key],
                            [field.key]: next,
                          },
                        }))
                    )}
                  </div>
                ))}
              </div>
              <Button
                className="mt-2"
                onClick={() => void createRecord(domain.key)}
                disabled={busyKey === `create-${domain.key}`}
              >
                {busyKey === `create-${domain.key}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Add {domain.singularLabel}
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item) => {
                const id = String(item.id || "");
                const isEditing = editing?.domain === domain.key && editing.id === id;
                return (
                  <div key={id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-brand-600 font-mono">{id}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setEditing({
                              domain: domain.key,
                              id,
                              payload: domain.fields.reduce<Record<string, unknown>>((acc, field) => {
                                acc[field.key] = item[field.key];
                                return acc;
                              }, {}),
                            })
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void deleteRecord(domain.key, id)}
                          disabled={busyKey === `delete-${domain.key}-${id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {domain.fields.map((field) => (
                            <div key={`${domain.key}-edit-${field.key}`}>
                              <label className="block text-xs text-brand-600 mb-1">{field.label}</label>
                              {renderField(
                                field,
                                editing.payload[field.key],
                                (next) =>
                                  setEditing({
                                    ...editing,
                                    payload: {
                                      ...editing.payload,
                                      [field.key]: next,
                                    },
                                  })
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button onClick={() => void saveEdit()} disabled={busyKey === `edit-${domain.key}-${id}`}>
                            {busyKey === `edit-${domain.key}-${id}` ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Save
                          </Button>
                          <Button variant="outline" onClick={() => setEditing(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-brand-700">
                        {domain.fields.map((field) => (
                          <div key={`${id}-${field.key}`} className="rounded border border-border px-2 py-1">
                            <span className="font-semibold text-brand-900">{field.label}:</span>{" "}
                            {String(item[field.key] ?? "-")}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
