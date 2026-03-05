"use client";

import { useEffect, useState } from "react";
import { Database, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type FreshnessRow = {
  id: string;
  metric_type: string;
  last_updated_at: string;
  record_count: number;
  confidence: string;
  computed_at: string;
};

type SyncLog = {
  id: string;
  integration_id: string;
  status: string;
  records_created: number;
  records_updated: number;
  records_failed: number;
  started_at: string;
  completed_at: string | null;
};

export default function DataRunsPage() {
  const [freshness, setFreshness] = useState<FreshnessRow[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/data/health")
      .then((r) => r.json())
      .then((data) => {
        setFreshness(data.freshness ?? []);
        setSyncLogs(data.syncLogs ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-accent-800 sm:text-3xl">Data Runs</h1>
        <div className="animate-pulse h-48 rounded-lg bg-brand-100/50" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-accent-800 sm:text-3xl">Data Runs</h1>
        <p className="mt-1 text-brand-600">
          Ingestion runs, sync logs, and data freshness for your workspace.
        </p>
      </div>

      {/* Freshness metrics */}
      <Card className="p-6 border border-border/60">
        <h2 className="font-semibold text-brand-900 mb-4 flex items-center gap-2">
          <Database className="h-5 w-5" />
          Freshness Metrics
        </h2>
        {freshness.length === 0 ? (
          <p className="text-brand-500 text-sm">No freshness metrics yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left py-2 font-medium text-brand-700">Type</th>
                  <th className="text-left py-2 font-medium text-brand-700">Last Updated</th>
                  <th className="text-left py-2 font-medium text-brand-700">Records</th>
                  <th className="text-left py-2 font-medium text-brand-700">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {freshness.map((f) => (
                  <tr key={f.id} className="border-b border-border/40">
                    <td className="py-2">{f.metric_type}</td>
                    <td className="py-2">{new Date(f.last_updated_at).toLocaleString()}</td>
                    <td className="py-2">{f.record_count ?? "—"}</td>
                    <td className="py-2">
                      <Badge
                        variant="outline"
                        className={
                          f.confidence === "high"
                            ? "border-emerald-200 text-emerald-700"
                            : f.confidence === "medium"
                              ? "border-amber-200 text-amber-700"
                              : "border-rose-200 text-rose-700"
                        }
                      >
                        {f.confidence}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Sync logs */}
      <Card className="p-6 border border-border/60">
        <h2 className="font-semibold text-brand-900 mb-4 flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Integration Syncs
        </h2>
        {syncLogs.length === 0 ? (
          <p className="text-brand-500 text-sm">No sync logs yet. Connect an integration to see syncs here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left py-2 font-medium text-brand-700">Started</th>
                  <th className="text-left py-2 font-medium text-brand-700">Status</th>
                  <th className="text-left py-2 font-medium text-brand-700">Created</th>
                  <th className="text-left py-2 font-medium text-brand-700">Updated</th>
                  <th className="text-left py-2 font-medium text-brand-700">Failed</th>
                </tr>
              </thead>
              <tbody>
                {syncLogs.map((s) => (
                  <tr key={s.id} className="border-b border-border/40">
                    <td className="py-2">{new Date(s.started_at).toLocaleString()}</td>
                    <td className="py-2">
                      {s.status === "success" ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500 inline" />
                      ) : s.status === "failed" ? (
                        <XCircle className="h-4 w-4 text-rose-500 inline" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-500 inline" />
                      )}{" "}
                      {s.status}
                    </td>
                    <td className="py-2">{s.records_created ?? 0}</td>
                    <td className="py-2">{s.records_updated ?? 0}</td>
                    <td className="py-2">{s.records_failed ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
