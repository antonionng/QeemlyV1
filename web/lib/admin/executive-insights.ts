import {
  buildMarketInsightsResponse,
  type MarketInsightsResponse,
} from "@/lib/benchmarks/market-insights";
import type { MarketBenchmark } from "@/lib/benchmarks/platform-market";

type WorkspaceRow = {
  id: string;
  name: string;
};

type EmployeeRow = {
  workspace_id: string;
};

type UploadRow = {
  workspace_id: string;
  created_at: string;
};

type UploadedBenchmarkRow = {
  workspace_id: string;
  source: string;
};

type SourceRow = {
  id: string;
  enabled: boolean;
  config?: {
    health?: string;
  };
};

type JobRow = {
  status: string;
};

type FreshnessRow = {
  last_updated_at: string | null;
};

export type ExecutiveInsightsResponse = {
  market: {
    summary: MarketInsightsResponse["summary"] & {
      staleRows: number;
    };
    topRoles: MarketInsightsResponse["coverage"]["topRoles"];
    topLocations: MarketInsightsResponse["coverage"]["topLocations"];
    topLevels: MarketInsightsResponse["coverage"]["topLevels"];
    sourceMix: MarketInsightsResponse["coverage"]["sourceMix"];
    lowDensityRows: MarketInsightsResponse["coverage"]["lowDensityRows"];
  };
  tenantHealth: {
    workspaceCount: number;
    activeWorkspaceCount: number;
    employeeCount: number;
    uploadsLast30Days: number;
    uploadedBenchmarkRows: number;
    topWorkspaces: Array<{
      workspaceId: string;
      workspaceName: string;
      employeeCount: number;
      uploadCount: number;
      uploadedBenchmarkCount: number;
    }>;
  };
  ops: {
    sources: {
      total: number;
      enabled: number;
      degraded: number;
    };
    jobs24h: {
      total: number;
      success: number;
      failed: number;
      running: number;
      partial: number;
    };
    freshness: {
      score: "fresh" | "stale" | "critical" | "unknown";
      lastUpdatedAt: string | null;
      stalenessHours: number | null;
    };
  };
  integrityFlags: Array<{
    id: string;
    severity: "warning" | "info";
    title: string;
  }>;
};

export function buildExecutiveInsightsResponse({
  marketRows,
  workspaces,
  employees,
  uploads,
  uploadedBenchmarks,
  sources,
  jobs,
  freshnessRows,
  now = new Date(),
}: {
  marketRows: MarketBenchmark[];
  workspaces: WorkspaceRow[];
  employees: EmployeeRow[];
  uploads: UploadRow[];
  uploadedBenchmarks: UploadedBenchmarkRow[];
  sources: SourceRow[];
  jobs: JobRow[];
  freshnessRows: FreshnessRow[];
  now?: Date;
}): ExecutiveInsightsResponse {
  const market = buildMarketInsightsResponse({
    marketRows,
    workspaceOverlay: {
      count: 0,
      uniqueRoles: 0,
      uniqueLocations: 0,
      sources: [],
    },
    diagnostics: {
      market: {
        readMode: "service",
        clientWarning: null,
        error: null,
        warning: null,
        hasServiceRoleKey: true,
        hasPlatformWorkspaceId: true,
      },
    },
    now,
  });

  const employeeCountByWorkspace = new Map<string, number>();
  for (const employee of employees) {
    employeeCountByWorkspace.set(
      employee.workspace_id,
      (employeeCountByWorkspace.get(employee.workspace_id) ?? 0) + 1,
    );
  }

  const uploadCountByWorkspace = new Map<string, number>();
  for (const upload of uploads) {
    uploadCountByWorkspace.set(
      upload.workspace_id,
      (uploadCountByWorkspace.get(upload.workspace_id) ?? 0) + 1,
    );
  }

  const uploadedBenchmarkCountByWorkspace = new Map<string, number>();
  for (const benchmark of uploadedBenchmarks) {
    uploadedBenchmarkCountByWorkspace.set(
      benchmark.workspace_id,
      (uploadedBenchmarkCountByWorkspace.get(benchmark.workspace_id) ?? 0) + 1,
    );
  }

  const topWorkspaces = workspaces
    .map((workspace) => ({
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      employeeCount: employeeCountByWorkspace.get(workspace.id) ?? 0,
      uploadCount: uploadCountByWorkspace.get(workspace.id) ?? 0,
      uploadedBenchmarkCount: uploadedBenchmarkCountByWorkspace.get(workspace.id) ?? 0,
    }))
    .sort(
      (left, right) =>
        right.employeeCount - left.employeeCount ||
        right.uploadCount - left.uploadCount ||
        left.workspaceName.localeCompare(right.workspaceName),
    )
    .slice(0, 5);

  const lastUpdatedMs = freshnessRows
    .map((row) => (row.last_updated_at ? new Date(row.last_updated_at).getTime() : Number.NaN))
    .filter((value) => Number.isFinite(value))
    .sort((left, right) => right - left)[0];
  const stalenessHours =
    lastUpdatedMs != null ? Math.round((now.getTime() - lastUpdatedMs) / (1000 * 60 * 60)) : null;
  const freshnessScore: ExecutiveInsightsResponse["ops"]["freshness"]["score"] =
    stalenessHours == null ? "unknown" : stalenessHours < 6 ? "fresh" : stalenessHours < 24 ? "stale" : "critical";

  const degradedSources = sources.filter((source) => source.config?.health === "degraded").length;
  const byStatus = {
    success: jobs.filter((job) => job.status === "success").length,
    failed: jobs.filter((job) => job.status === "failed").length,
    running: jobs.filter((job) => job.status === "running" || job.status === "queued").length,
    partial: jobs.filter((job) => job.status === "partial").length,
  };

  const activeWorkspaceCount = workspaces.filter((workspace) => {
    const workspaceId = workspace.id;
    return (
      (employeeCountByWorkspace.get(workspaceId) ?? 0) > 0 ||
      (uploadCountByWorkspace.get(workspaceId) ?? 0) > 0 ||
      (uploadedBenchmarkCountByWorkspace.get(workspaceId) ?? 0) > 0
    );
  }).length;

  const integrityFlags: ExecutiveInsightsResponse["integrityFlags"] = [];
  if (market.coverage.lowDensityRows.length > 0) {
    integrityFlags.push({
      id: "low-density-market-rows",
      severity: "warning",
      title: "Some pooled rows are below the contributor threshold",
    });
  }
  if (degradedSources > 0) {
    integrityFlags.push({
      id: "degraded-sources",
      severity: "warning",
      title: "One or more ingestion sources are degraded",
    });
  }

  return {
    market: {
      summary: {
        ...market.summary,
        staleRows: market.freshness.staleRows,
      },
      topRoles: market.coverage.topRoles,
      topLocations: market.coverage.topLocations,
      topLevels: market.coverage.topLevels,
      sourceMix: market.coverage.sourceMix,
      lowDensityRows: market.coverage.lowDensityRows,
    },
    tenantHealth: {
      workspaceCount: workspaces.length,
      activeWorkspaceCount,
      employeeCount: employees.length,
      uploadsLast30Days: uploads.length,
      uploadedBenchmarkRows: uploadedBenchmarks.length,
      topWorkspaces,
    },
    ops: {
      sources: {
        total: sources.length,
        enabled: sources.filter((source) => source.enabled).length,
        degraded: degradedSources,
      },
      jobs24h: {
        total: jobs.length,
        ...byStatus,
      },
      freshness: {
        score: freshnessScore,
        lastUpdatedAt: lastUpdatedMs != null ? new Date(lastUpdatedMs).toISOString() : null,
        stalenessHours,
      },
    },
    integrityFlags,
  };
}
