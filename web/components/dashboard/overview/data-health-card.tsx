"use client";

import { useEffect, useState } from "react";
import { Database, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type FreshnessRow = {
  id: string;
  metric_type: string;
  last_updated_at: string;
  record_count: number;
  confidence: string;
};

type SyncLog = {
  id: string;
  status: string;
  records_created: number;
  records_updated: number;
  records_failed: number;
  started_at: string;
  completed_at: string | null;
};

interface DataHealthCardProps {
  benchmarkCoverage?: {
    activeEmployees: number;
    benchmarkedEmployees: number;
  };
}

export function DataHealthCard({ benchmarkCoverage }: DataHealthCardProps) {
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
      <Card className="dash-card p-4">
        <div className="animate-pulse h-20 rounded bg-accent-100" />
      </Card>
    );
  }

  const hasFreshness = freshness.length > 0;
  const latestFresh = freshness[0];
  const lastSync = syncLogs[0];
  const activeEmployees = benchmarkCoverage?.activeEmployees ?? 0;
  const benchmarkedEmployees = benchmarkCoverage?.benchmarkedEmployees ?? 0;
  const hasCoverage = activeEmployees > 0;
  const coveragePct = hasCoverage ? Math.round((benchmarkedEmployees / activeEmployees) * 100) : 0;

  return (
    <Card className="dash-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-accent-600" />
          <h3 className="font-semibold text-accent-900">Data Health</h3>
        </div>
        <Link href="/dashboard/data/runs">
          <span className="text-sm text-accent-600 hover:underline">View runs</span>
        </Link>
      </div>
      <div className="space-y-2 text-sm">
        {hasCoverage && (
          <div className="rounded-lg border border-accent-200 bg-accent-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-accent-700">Benchmark coverage</span>
              <span className="text-accent-700">
                {benchmarkedEmployees}/{activeEmployees} ({coveragePct}%)
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-accent-200">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${coveragePct}%` }}
              />
            </div>
            {coveragePct < 100 && (
              <p className="mt-2 text-xs text-accent-600">
                Some employees do not have role/location/level benchmark matches yet.
              </p>
            )}
          </div>
        )}
        {hasFreshness && latestFresh && (
          <div className="flex items-center justify-between">
            <span className="text-accent-700">Benchmarks</span>
            <div className="flex items-center gap-2">
              <span className="text-accent-500">
                {new Date(latestFresh.last_updated_at).toLocaleDateString()}
              </span>
              <Badge
                variant="outline"
                className={
                  latestFresh.confidence === "high"
                    ? "border-emerald-200 text-emerald-700"
                    : latestFresh.confidence === "medium"
                      ? "border-amber-200 text-amber-700"
                      : "border-rose-200 text-rose-700"
                }
              >
                {latestFresh.confidence}
              </Badge>
            </div>
          </div>
        )}
        {syncLogs.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-accent-700">Last sync</span>
            {lastSync ? (
              <div className="flex items-center gap-2">
                {lastSync.status === "success" ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-500" />
                )}
                <span className="text-accent-500">
                  {new Date(lastSync.started_at).toLocaleDateString()}
                </span>
              </div>
            ) : null}
          </div>
        )}
        {!hasFreshness && syncLogs.length === 0 && (
          <p className="text-accent-500">No data health metrics yet.</p>
        )}
      </div>
    </Card>
  );
}
