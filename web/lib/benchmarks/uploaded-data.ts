export type UploadedBenchmark = {
  roleId: string;
  locationId: string;
  levelId: string;
  currency: string;
  percentiles: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
  sampleSize?: number;
  lastUpdated?: string;
};

export type UploadedBenchmarksMeta = {
  fileName?: string;
  size?: number;
  uploadedAt?: string;
};

export type UploadedBenchmarksDataset = {
  rows: UploadedBenchmark[];
  byKey: Map<string, UploadedBenchmark>;
  errors: string[];
  meta?: UploadedBenchmarksMeta;
};

export const STORAGE_KEY_BENCHMARKS_CSV = "qeemly:benchmarksCsv";
export const STORAGE_KEY_BENCHMARKS_CSV_META = "qeemly:benchmarksCsvMeta";
export const BENCHMARKS_CSV_UPDATED_EVENT = "qeemly:benchmarksCsvUpdated";

export function makeBenchmarkKey(roleId: string, locationId: string, levelId: string) {
  return `${roleId}::${locationId}::${levelId}`;
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseNumber(value: string) {
  const n = Number(String(value).replace(/[, ]/g, ""));
  return Number.isFinite(n) ? n : null;
}

// Basic CSV parser (supports commas and quoted fields). Good enough for MVP uploads.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === "\"") {
      if (inQuotes && next === "\"") {
        field += "\"";
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && (ch === "," || ch === "\n" || ch === "\r")) {
      row.push(field);
      field = "";
      if (ch === "\r" && next === "\n") i++;
      if (ch === "\n" || ch === "\r") {
        // ignore trailing empty line
        if (row.some(cell => cell.trim() !== "")) rows.push(row);
        row = [];
      }
      continue;
    }

    field += ch;
  }

  row.push(field);
  if (row.some(cell => cell.trim() !== "")) rows.push(row);
  return rows;
}

export function parseUploadedBenchmarksCsv(params: {
  csvText: string;
  roles: Array<{ id: string; title: string }>;
  locations: Array<{ id: string; city: string; country: string }>;
  levels: Array<{ id: string; name: string }>;
}): UploadedBenchmarksDataset {
  const { csvText, roles, locations, levels } = params;
  const errors: string[] = [];

  const roleByNorm = new Map<string, string>();
  for (const r of roles) {
    roleByNorm.set(normalize(r.id), r.id);
    roleByNorm.set(normalize(r.title), r.id);
  }

  const locationByNorm = new Map<string, string>();
  for (const l of locations) {
    locationByNorm.set(normalize(l.id), l.id);
    locationByNorm.set(normalize(l.city), l.id);
    locationByNorm.set(normalize(`${l.city}, ${l.country}`), l.id);
    locationByNorm.set(normalize(`${l.city} ${l.country}`), l.id);
  }

  const levelByNorm = new Map<string, string>();
  for (const lv of levels) {
    levelByNorm.set(normalize(lv.id), lv.id);
    levelByNorm.set(normalize(lv.name), lv.id);
  }

  const table = parseCsv(csvText);
  if (table.length === 0) {
    return { rows: [], byKey: new Map(), errors: ["CSV is empty."] };
  }

  const header = table[0].map(h => normalize(h));
  const idx = (name: string) => header.indexOf(normalize(name));

  const required = ["role", "location", "level", "currency", "p10", "p25", "p50", "p75", "p90"];
  const missing = required.filter(k => idx(k) === -1);
  if (missing.length) {
    errors.push(`Missing required columns: ${missing.join(", ")}`);
  }

  const rows: UploadedBenchmark[] = [];
  const byKey = new Map<string, UploadedBenchmark>();

  for (let r = 1; r < table.length; r++) {
    const line = table[r];
    const get = (k: string) => (idx(k) >= 0 ? (line[idx(k)] ?? "").trim() : "");

    const roleRaw = get("role");
    const locationRaw = get("location");
    const levelRaw = get("level");
    const currency = get("currency");

    const roleId = roleByNorm.get(normalize(roleRaw));
    const locationId = locationByNorm.get(normalize(locationRaw));

    let levelId = levelByNorm.get(normalize(levelRaw));
    if (!levelId) {
      // common case: "Senior (IC3)" -> ic3
      const m = normalize(levelRaw).match(/\b(ic[1-5]|m[1-2]|d[1-2]|vp)\b/);
      if (m?.[1]) levelId = levelByNorm.get(normalize(m[1])) ?? m[1];
    }

    const p10 = parseNumber(get("p10"));
    const p25 = parseNumber(get("p25"));
    const p50 = parseNumber(get("p50"));
    const p75 = parseNumber(get("p75"));
    const p90 = parseNumber(get("p90"));

    const sampleSize = parseNumber(get("samplesize")) ?? parseNumber(get("sampleSize"));
    const lastUpdated = get("lastupdated") || get("lastUpdated");

    const rowErrors: string[] = [];
    if (!roleId) rowErrors.push(`Unknown role '${roleRaw}'`);
    if (!locationId) rowErrors.push(`Unknown location '${locationRaw}'`);
    if (!levelId) rowErrors.push(`Unknown level '${levelRaw}'`);
    if (!currency) rowErrors.push("Missing currency");
    if ([p10, p25, p50, p75, p90].some(v => v == null)) rowErrors.push("Missing percentile value(s)");

    if (rowErrors.length) {
      errors.push(`Row ${r + 1}: ${rowErrors.join("; ")}`);
      continue;
    }

    const record: UploadedBenchmark = {
      roleId: roleId!,
      locationId: locationId!,
      levelId: levelId!,
      currency,
      percentiles: { p10: p10!, p25: p25!, p50: p50!, p75: p75!, p90: p90! },
      sampleSize: sampleSize ?? undefined,
      lastUpdated: lastUpdated || undefined,
    };

    const key = makeBenchmarkKey(record.roleId, record.locationId, record.levelId);
    byKey.set(key, record);
    rows.push(record);
  }

  return { rows, byKey, errors };
}

export function loadUploadedBenchmarksFromStorage(params: {
  roles: Array<{ id: string; title: string }>;
  locations: Array<{ id: string; city: string; country: string }>;
  levels: Array<{ id: string; name: string }>;
}): UploadedBenchmarksDataset | null {
  if (typeof window === "undefined") return null;
  const csvText = localStorage.getItem(STORAGE_KEY_BENCHMARKS_CSV);
  if (!csvText) return null;

  let meta: UploadedBenchmarksMeta | undefined;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BENCHMARKS_CSV_META);
    meta = raw ? (JSON.parse(raw) as UploadedBenchmarksMeta) : undefined;
  } catch {
    meta = undefined;
  }

  const dataset = parseUploadedBenchmarksCsv({ csvText, ...params });
  return { ...dataset, meta };
}


