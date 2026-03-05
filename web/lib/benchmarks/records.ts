import {
  generateTrendData,
  getConfidence,
  getRole,
  type Level,
  type Location,
  type Role,
  type SalaryBenchmark,
} from "@/lib/dashboard/dummy-data";
import { makeBenchmarkKey, type UploadedBenchmark } from "@/lib/benchmarks/uploaded-data";
import type { BenchmarkRecord } from "@/lib/benchmarks/filters";

export function buildDummyBenchmarkRecords(params: {
  roles: Role[];
  locations: Location[];
  levels: Level[];
}) {
  void params;
  return [] as BenchmarkRecord[];
}

export function buildUploadedBenchmarkRecord(uploaded: UploadedBenchmark): BenchmarkRecord {
  const sampleSize = uploaded.sampleSize ?? 0;
  const confidence = getConfidence(sampleSize);
  const p50 = uploaded.percentiles.p50;
  const roleFamily = getRole(uploaded.roleId)?.family;
  const base: SalaryBenchmark = {
    roleId: uploaded.roleId,
    locationId: uploaded.locationId,
    levelId: uploaded.levelId,
    currency: uploaded.currency as SalaryBenchmark["currency"],
    percentiles: uploaded.percentiles,
    sampleSize,
    confidence,
    lastUpdated: uploaded.lastUpdated ?? new Date().toISOString(),
    momChange: 0,
    yoyChange: 0,
    trend: generateTrendData(p50),
  };

  return {
    ...base,
    roleFamily,
    source: "uploaded",
  };
}

export function mergeBenchmarkRecords(params: {
  dummyRecords: BenchmarkRecord[];
  uploadedRows?: UploadedBenchmark[];
}) {
  const byKey = new Map<string, BenchmarkRecord>();
  for (const record of params.dummyRecords) {
    const key = makeBenchmarkKey(record.roleId, record.locationId, record.levelId);
    byKey.set(key, record);
  }

  if (params.uploadedRows?.length) {
    for (const row of params.uploadedRows) {
      const record = buildUploadedBenchmarkRecord(row);
      const key = makeBenchmarkKey(record.roleId, record.locationId, record.levelId);
      byKey.set(key, record);
    }
  }

  return { records: Array.from(byKey.values()), byKey };
}
