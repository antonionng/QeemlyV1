"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Check, Loader2, RefreshCcw, Save, Trash2, X } from "lucide-react";
import {
  DEFAULT_COMPLIANCE_SETTINGS,
  DOMAIN_CONFIG,
  type ComplianceDomain,
  type ComplianceSettingsPayload,
  type FieldDef,
} from "@/lib/compliance/settings-schema";
import { useWorkspaceChangeVersion } from "@/lib/workspace-client";
import { parseClientError } from "@/lib/errors/client-safe";

const DOMAIN_DEFS = DOMAIN_CONFIG;
type DomainGuidance = {
  purpose: string;
  whyItMatters: string;
  impacts: string[];
  example: string;
};

const DOMAIN_GUIDANCE: Record<ComplianceDomain, DomainGuidance> = {
  policies: {
    purpose: "Track policy obligations and completion progress.",
    whyItMatters: "Low completion directly increases policy risk and can block audits.",
    impacts: ["Risk Heatmap", "Policy Completion Card", "Audit Detail Context"],
    example: "Create one row per policy family (Code of Conduct, Data Privacy, Whistleblower).",
  },
  "regulatory-updates": {
    purpose: "Store legal/regulatory changes by jurisdiction.",
    whyItMatters: "High-impact updates raise risk and should trigger policy or process updates.",
    impacts: ["Regulatory Updates Feed", "Risk Heatmap", "Jurisdiction Focus"],
    example: "Log each relevant labor-law circular with impact and status.",
  },
  deadlines: {
    purpose: "Capture required compliance due dates.",
    whyItMatters: "Missed deadlines move items into overdue risk and operational escalation.",
    impacts: ["Deadlines Side Card", "Risk Heatmap", "Operational Follow-up"],
    example: "Track permit renewals, reporting deadlines, and mandatory filings.",
  },
  "visa-cases": {
    purpose: "Manage immigration/visa lifecycle items.",
    whyItMatters: "Expiring or overdue visas are high-severity workforce compliance risks.",
    impacts: ["Visa Side Card", "Risk Heatmap", "Employee Compliance Readiness"],
    example: "Add one row per active visa case with expiry and current status.",
  },
  documents: {
    purpose: "Track required compliance documents and expiry.",
    whyItMatters: "Expired or missing documents increase audit exposure and readiness gaps.",
    impacts: ["Documents Side Card", "Risk Heatmap", "Renewal Planning"],
    example: "Track permits, contracts, certificates, and key statutory documents.",
  },
  "audit-events": {
    purpose: "Maintain an auditable activity timeline.",
    whyItMatters: "Audit trails prove controls are operating and support investigations.",
    impacts: ["Audit Timeline Card", "Evidence for Reviews", "Change Traceability"],
    example: "Log major actions like policy updates, document approvals, and risk overrides.",
  },
};
const JURISDICTION_SUGGESTIONS = [
  "UAE",
  "KSA",
  "Qatar",
  "Bahrain",
  "Kuwait",
  "Oman",
  "Egypt",
  "Jordan",
  "United Kingdom",
  "United States",
  "Germany",
  "Singapore",
];

function normalizeJurisdictions(value: unknown): string[] {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((item) => String(item ?? "").trim()).filter(Boolean)));
  }
  if (typeof value === "string") {
    return Array.from(
      new Set(
        value
          .split(/[,\n;]+/)
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );
  }
  return [];
}

export function ComplianceSettingsPanel() {
  const workspaceChangeVersion = useWorkspaceChangeVersion();
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsFieldErrors, setSettingsFieldErrors] = useState<Record<string, string>>({});
  const [recordError, setRecordError] = useState<string | null>(null);
  const [settings, setSettings] = useState<ComplianceSettingsPayload>({
    ...DEFAULT_COMPLIANCE_SETTINGS,
    risk_weights: { ...DEFAULT_COMPLIANCE_SETTINGS.risk_weights },
  });
  const [integrationSyncCount, setIntegrationSyncCount] = useState(0);
  const [lastIntegrationSync, setLastIntegrationSync] = useState<string | null>(null);
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>(
    DEFAULT_COMPLIANCE_SETTINGS.default_jurisdictions
  );
  const [jurisdictionModalOpen, setJurisdictionModalOpen] = useState(false);
  const [jurisdictionQuery, setJurisdictionQuery] = useState("");

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
  const [expandedCreateDomain, setExpandedCreateDomain] = useState<ComplianceDomain | null>("policies");

  const loadAll = async () => {
    setLoading(true);
    setSettingsError(null);
    setSettingsFieldErrors({});
    setRecordError(null);
    try {
      const settingsRes = await fetch("/api/settings/compliance");
      const settingsData = await settingsRes.json();
      if (!settingsRes.ok) {
        throw new Error(parseClientError(settingsData).message || "Failed to load compliance settings");
      }
      const normalizedJurisdictions = normalizeJurisdictions(settingsData.settings?.default_jurisdictions);
      setSettings({
        ...settingsData.settings,
        default_jurisdictions:
          normalizedJurisdictions.length > 0
            ? normalizedJurisdictions
            : DEFAULT_COMPLIANCE_SETTINGS.default_jurisdictions,
      });
      setSelectedJurisdictions(
        normalizedJurisdictions.length > 0
          ? normalizedJurisdictions
          : DEFAULT_COMPLIANCE_SETTINGS.default_jurisdictions
      );
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
  }, [workspaceChangeVersion]);

  const saveSettings = async () => {
    setSavingSettings(true);
    setSettingsError(null);
    setSettingsFieldErrors({});
    try {
      if (selectedJurisdictions.length === 0) {
        throw new Error("At least one default jurisdiction is required");
      }
      const payload: ComplianceSettingsPayload = {
        ...settings,
        default_jurisdictions: selectedJurisdictions,
      };
      const res = await fetch("/api/settings/compliance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) {
        const problem = parseClientError(body);
        setSettingsFieldErrors(problem.fields ?? {});
        throw new Error(problem.message || "Failed to save compliance settings");
      }
      if (body.settings) {
        setSettings(body.settings);
      } else {
        setSettings((prev) => ({ ...prev, is_compliance_configured: true }));
      }
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Failed to save compliance settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredJurisdictionSuggestions = JURISDICTION_SUGGESTIONS.filter((item) =>
    item.toLowerCase().includes(jurisdictionQuery.trim().toLowerCase())
  );
  const canAddCustomJurisdiction =
    jurisdictionQuery.trim().length > 0 &&
    !selectedJurisdictions.some((item) => item.toLowerCase() === jurisdictionQuery.trim().toLowerCase());

  const toggleJurisdiction = (jurisdiction: string) => {
    setSelectedJurisdictions((prev) => {
      const exists = prev.some((item) => item.toLowerCase() === jurisdiction.toLowerCase());
      if (exists) return prev.filter((item) => item.toLowerCase() !== jurisdiction.toLowerCase());
      return [...prev, jurisdiction];
    });
  };

  const addCustomJurisdiction = () => {
    const value = jurisdictionQuery.trim();
    if (!value) return;
    setSelectedJurisdictions((prev) => {
      const exists = prev.some((item) => item.toLowerCase() === value.toLowerCase());
      if (exists) return prev;
      return [...prev, value];
    });
    setJurisdictionQuery("");
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
      if (!res.ok) throw new Error(parseClientError(body).message || `Failed to create ${domain}`);
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
      if (!res.ok) throw new Error(parseClientError(body).message || "Failed to update record");
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
      if (!res.ok) throw new Error(parseClientError(body).message || "Failed to delete record");
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
    <div className="settings-page space-y-6">
      {(settingsError || recordError) && (
        <div className="settings-alert settings-alert-danger flex items-center gap-2 px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{settingsError || recordError}</span>
        </div>
      )}

      <Card className="panel p-6 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-900">Workforce Compliance Rules</h2>
            <p className="text-sm text-brand-600">
              Configure jurisdiction and risk timing defaults used by the workforce compliance view.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {settings.is_compliance_configured && (
              <span className="status-chip status-chip--success">Configured</span>
            )}
            <Button variant="outline" onClick={() => void loadAll()}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Reload
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface-2 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">Integration syncs</p>
            <p className="mt-1 text-xl font-semibold text-brand-900">{integrationSyncCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface-2 px-4 py-3 md:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">Last integration success</p>
            <p className="mt-1 text-sm font-medium text-brand-900">
              {lastIntegrationSync ? new Date(lastIntegrationSync).toLocaleString() : "N/A"}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-500">
            Data source preferences (advanced)
          </p>
          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
          <label className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={settings.prefer_integration_data}
              onChange={(e) => setSettings((p) => ({ ...p, prefer_integration_data: e.target.checked }))}
            />
            Prefer integration data
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={settings.prefer_import_data}
              onChange={(e) => setSettings((p) => ({ ...p, prefer_import_data: e.target.checked }))}
            />
            Prefer import data
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={settings.allow_manual_overrides}
              onChange={(e) => setSettings((p) => ({ ...p, allow_manual_overrides: e.target.checked }))}
            />
            Allow manual overrides
          </label>
        </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-700">Default Jurisdictions</label>
            <div className="rounded-xl border border-border bg-surface-2 p-3">
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedJurisdictions.length === 0 ? (
                  <span className="text-sm text-brand-500">No jurisdictions selected yet.</span>
                ) : (
                  selectedJurisdictions.map((jurisdiction) => (
                    <span
                      key={jurisdiction}
                      className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800"
                    >
                      {jurisdiction}
                      <button
                        type="button"
                        className="rounded-full p-0.5 text-brand-600 hover:bg-brand-100"
                        aria-label={`Remove ${jurisdiction}`}
                        onClick={() =>
                          setSelectedJurisdictions((prev) =>
                            prev.filter((item) => item.toLowerCase() !== jurisdiction.toLowerCase())
                          )
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
              <Button type="button" variant="outline" onClick={() => setJurisdictionModalOpen(true)}>
                Select jurisdictions
              </Button>
              {settingsFieldErrors.default_jurisdictions && (
                <p className="mt-2 text-xs font-medium text-rose-600">
                  {settingsFieldErrors.default_jurisdictions}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-700">Visa Lead Time (days)</label>
            <Input
              type="number"
              value={settings.visa_lead_time_days}
              onChange={(e) => setSettings((p) => ({ ...p, visa_lead_time_days: Number(e.target.value || 0) }))}
            />
            {settingsFieldErrors.visa_lead_time_days && (
              <p className="mt-2 text-xs font-medium text-rose-600">
                {settingsFieldErrors.visa_lead_time_days}
              </p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-700">Deadline SLA (days)</label>
            <Input
              type="number"
              value={settings.deadline_sla_days}
              onChange={(e) => setSettings((p) => ({ ...p, deadline_sla_days: Number(e.target.value || 1) }))}
            />
            {settingsFieldErrors.deadline_sla_days && (
              <p className="mt-2 text-xs font-medium text-rose-600">
                {settingsFieldErrors.deadline_sla_days}
              </p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-700">Document Renewal Threshold (days)</label>
            <Input
              type="number"
              value={settings.document_renewal_threshold_days}
              onChange={(e) =>
                setSettings((p) => ({ ...p, document_renewal_threshold_days: Number(e.target.value || 1) }))
              }
            />
            {settingsFieldErrors.document_renewal_threshold_days && (
              <p className="mt-2 text-xs font-medium text-rose-600">
                {settingsFieldErrors.document_renewal_threshold_days}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <Button onClick={() => void saveSettings()} disabled={savingSettings}>
            {savingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Compliance Rules
          </Button>
        </div>

        <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">
          <p className="font-medium text-brand-800">How these rules affect the dashboard</p>
          <p className="mt-1">
            Selected jurisdictions currently scope regulatory updates. Visa, deadline, and document thresholds set what counts
            as expiring or overdue. Data source preferences filter rows by source when multiple sources are present.
          </p>
        </div>
      </Card>

      {jurisdictionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-brand-900">Select default jurisdictions</h3>
                <p className="text-sm text-brand-600">Choose from suggestions or add a custom one.</p>
              </div>
              <button
                type="button"
                className="rounded-full p-2 text-brand-600 hover:bg-surface-2"
                aria-label="Close jurisdiction selector"
                onClick={() => {
                  setJurisdictionModalOpen(false);
                  setJurisdictionQuery("");
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <Input
              placeholder="Search or type custom jurisdiction"
              value={jurisdictionQuery}
              onChange={(e) => setJurisdictionQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canAddCustomJurisdiction) {
                  e.preventDefault();
                  addCustomJurisdiction();
                }
              }}
            />

            {canAddCustomJurisdiction && (
              <button
                type="button"
                className="mt-2 rounded-lg border border-dashed border-brand-300 px-3 py-2 text-sm text-brand-700 hover:bg-brand-50"
                onClick={addCustomJurisdiction}
              >
                Add &quot;{jurisdictionQuery.trim()}&quot;
              </button>
            )}

            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
              {filteredJurisdictionSuggestions.map((jurisdiction) => {
                const isSelected = selectedJurisdictions.some(
                  (item) => item.toLowerCase() === jurisdiction.toLowerCase()
                );
                return (
                  <button
                    key={jurisdiction}
                    type="button"
                    onClick={() => toggleJurisdiction(jurisdiction)}
                    className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm text-brand-900 hover:bg-surface-2"
                  >
                    <span>{jurisdiction}</span>
                    {isSelected ? <Check className="h-4 w-4 text-brand-600" /> : null}
                  </button>
                );
              })}
              {filteredJurisdictionSuggestions.length === 0 && (
                <p className="rounded-lg border border-dashed border-border px-3 py-3 text-sm text-brand-500">
                  No suggestions found. Add a custom jurisdiction above.
                </p>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setJurisdictionModalOpen(false);
                  setJurisdictionQuery("");
                }}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card className="panel p-6 md:p-7">
        <div>
          <h2 className="text-lg font-semibold text-brand-900">Compliance Records Registry</h2>
          <p className="text-sm text-brand-600">
            Manage the operational records that feed workforce compliance cards and audit context.
          </p>
        </div>
      </Card>

      {Object.values(DOMAIN_DEFS).map((domain) => {
        const items = records[domain.key] || [];
        const guidance = DOMAIN_GUIDANCE[domain.key];
        const isCreateOpen = expandedCreateDomain === domain.key;
        return (
          <Card key={domain.key} className="panel space-y-5 p-6 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-brand-900">{domain.label}</h3>
                <p className="text-sm text-brand-700">{guidance.purpose}</p>
                <p className="text-xs text-brand-600">{guidance.whyItMatters}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="status-chip status-chip--info">{items.length} records</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setExpandedCreateDomain((prev) => (prev === domain.key ? null : domain.key))}
                >
                  {isCreateOpen ? "Hide create form" : `Add ${domain.singularLabel}`}
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-xs text-brand-700">
              <p>
                <span className="font-semibold text-brand-800">Impacts:</span> {guidance.impacts.join(" | ")}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-brand-800">Example:</span> {guidance.example}
              </p>
            </div>

            {isCreateOpen && (
              <div className="rounded-xl border border-border bg-surface-2 p-4">
                <label className="mb-3 block text-sm font-semibold text-brand-800">Create {domain.singularLabel}</label>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {domain.fields.map((field) => (
                    <div key={`${domain.key}-create-${field.key}`}>
                      <label className="mb-1 block text-xs font-semibold text-brand-600">{field.label}</label>
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
                  className="mt-4"
                  onClick={() => void createRecord(domain.key)}
                  disabled={busyKey === `create-${domain.key}`}
                >
                  {busyKey === `create-${domain.key}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Add {domain.singularLabel}
                </Button>
              </div>
            )}

            <div className="space-y-3">
              {items.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-surface-2 px-4 py-6 text-sm text-brand-500">
                  No records created yet for {domain.label.toLowerCase()}.
                </div>
              )}
              {items.map((item) => {
                const id = String(item.id || "");
                const isEditing = editing?.domain === domain.key && editing.id === id;
                return (
                  <div key={id} className="rounded-xl border border-border bg-white p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded bg-brand-50 px-2 py-1 text-xs text-brand-700">{id}</span>
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
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {domain.fields.map((field) => (
                            <div key={`${domain.key}-edit-${field.key}`}>
                              <label className="mb-1 block text-xs font-semibold text-brand-600">{field.label}</label>
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
                      <div className="grid grid-cols-1 gap-2 text-sm text-brand-700 md:grid-cols-2">
                        {domain.fields.map((field) => (
                          <div key={`${id}-${field.key}`} className="rounded-lg border border-border px-3 py-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">{field.label}</p>
                            <p className="mt-1 text-sm text-brand-900">{String(item[field.key] ?? "-")}</p>
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
