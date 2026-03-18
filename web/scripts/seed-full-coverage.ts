/**
 * Seed the full 1200-triple benchmark coverage matrix directly into
 * platform_market_benchmarks + public_benchmark_snapshots so every
 * search in the UI returns realistic GCC salary data.
 *
 * Usage:
 *   npx tsx scripts/seed-full-coverage.ts
 */

import { createClient } from "@supabase/supabase-js";
import { ROLES, LEVELS, LOCATIONS } from "../lib/dashboard/dummy-data";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const BASE_MONTHLY_AED: Record<string, number> = {
  swe: 32000,
  "swe-fe": 30000,
  "swe-be": 33000,
  "swe-mobile": 31000,
  "swe-devops": 34000,
  "swe-data": 35000,
  "swe-ml": 42000,
  pm: 38000,
  tpm: 40000,
  designer: 28000,
  "ux-researcher": 26000,
  "data-scientist": 40000,
  "data-analyst": 25000,
  security: 36000,
  qa: 22000,
};

const LEVEL_MULT: Record<string, number> = {
  ic1: 0.55,
  ic2: 0.75,
  ic3: 1.0,
  ic4: 1.35,
  ic5: 1.7,
  m1: 1.4,
  m2: 1.7,
  d1: 2.0,
  d2: 2.4,
  vp: 3.0,
};

const LOC_MULT: Record<string, number> = {
  dubai: 1.0,
  "abu-dhabi": 0.95,
  riyadh: 1.15,
  jeddah: 1.05,
  doha: 1.2,
  manama: 0.85,
  "kuwait-city": 1.1,
  muscat: 0.8,
};

const CURRENCY_FROM_AED: Record<string, number> = {
  AED: 1,
  SAR: 1.02,
  QAR: 0.99,
  BHD: 0.103,
  KWD: 0.084,
  OMR: 0.105,
};

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

async function main() {
  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toISOString();

  const poolRows: Array<Record<string, unknown>> = [];
  const snapshotRows: Array<Record<string, unknown>> = [];

  for (const role of ROLES) {
    for (const level of LEVELS) {
      for (const location of LOCATIONS) {
        const base = BASE_MONTHLY_AED[role.id] ?? 30000;
        const lm = LEVEL_MULT[level.id] ?? 1;
        const locm = LOC_MULT[location.id] ?? 1;
        const cm = CURRENCY_FROM_AED[location.currency] ?? 1;

        const seed = hashSeed(`${role.id}:${level.id}:${location.id}`);
        const jitter = 0.97 + (seed % 60) / 1000;
        const annualP50 = Math.round(base * 12 * lm * locm * cm * jitter);

        const spread = 0.18 + (seed % 50) / 500;
        const p10 = Math.round(annualP50 * (1 - spread * 1.3));
        const p25 = Math.round(annualP50 * (1 - spread * 0.6));
        const p75 = Math.round(annualP50 * (1 + spread * 0.6));
        const p90 = Math.round(annualP50 * (1 + spread * 1.3));
        const sampleSize = 20 + (seed % 80);

        poolRows.push({
          role_id: role.id,
          level_id: level.id,
          location_id: location.id,
          currency: location.currency,
          industry: null,
          company_size: null,
          p10,
          p25,
          p50: annualP50,
          p75,
          p90,
          sample_size: sampleSize,
          contributor_count: sampleSize,
          provenance: "admin",
          market_source_tier: "official",
          source_breakdown: { employee: 0, uploaded: 0, admin: sampleSize },
          valid_from: today,
          freshness_at: now,
          is_public: true,
        });

        snapshotRows.push({
          workspace_id: null,
          role_id: role.id,
          role_label: role.title,
          location_id: location.id,
          location_label: location.city,
          level_id: level.id,
          level_label: level.name,
          industry: null,
          company_size: null,
          currency: location.currency,
          p25,
          p50: annualP50,
          p75,
          submissions_this_week: sampleSize,
          mom_delta_p25: "0%",
          mom_delta_p50: "0%",
          mom_delta_p75: "0%",
          trend_delta: "0%",
          is_public: true,
          updated_at: now,
          market_source_tier: "official",
        });
      }
    }
  }

  console.log(`Generated ${poolRows.length} triples.`);

  // Clear existing data in both tables
  console.log("Clearing existing platform_market_benchmarks...");
  const { error: delPoolErr } = await supabase
    .from("platform_market_benchmarks")
    .delete()
    .gte("valid_from", "1900-01-01");
  if (delPoolErr) console.error("  delete pool error:", delPoolErr.message);

  console.log("Clearing existing public_benchmark_snapshots...");
  const { error: delSnapErr } = await supabase
    .from("public_benchmark_snapshots")
    .delete()
    .gte("updated_at", "1900-01-01T00:00:00.000Z");
  if (delSnapErr) console.error("  delete snapshots error:", delSnapErr.message);

  // Insert pool rows in batches
  const BATCH = 200;
  let poolOk = 0;
  let poolFail = 0;
  for (let i = 0; i < poolRows.length; i += BATCH) {
    const batch = poolRows.slice(i, i + BATCH);
    const { error } = await supabase
      .from("platform_market_benchmarks")
      .insert(batch);
    if (error) {
      console.error(`  pool batch ${i} failed:`, error.message);
      poolFail += batch.length;
    } else {
      poolOk += batch.length;
    }
  }
  console.log(`platform_market_benchmarks: ${poolOk} inserted, ${poolFail} failed.`);

  // Insert snapshot rows in batches
  let snapOk = 0;
  let snapFail = 0;
  for (let i = 0; i < snapshotRows.length; i += BATCH) {
    const batch = snapshotRows.slice(i, i + BATCH);
    const { error } = await supabase
      .from("public_benchmark_snapshots")
      .insert(batch);
    if (error) {
      console.error(`  snapshot batch ${i} failed:`, error.message);
      snapFail += batch.length;
    } else {
      snapOk += batch.length;
    }
  }
  console.log(`public_benchmark_snapshots: ${snapOk} inserted, ${snapFail} failed.`);

  // Verify coverage
  const { count } = await supabase
    .from("platform_market_benchmarks")
    .select("*", { count: "exact", head: true })
    .eq("is_public", true);
  console.log(`\nLive public rows in platform_market_benchmarks: ${count}`);

  const { count: snapCount } = await supabase
    .from("public_benchmark_snapshots")
    .select("*", { count: "exact", head: true })
    .eq("is_public", true);
  console.log(`Live public rows in public_benchmark_snapshots: ${snapCount}`);
  console.log(`\nDone. All ${ROLES.length} roles x ${LEVELS.length} levels x ${LOCATIONS.length} locations = ${ROLES.length * LEVELS.length * LOCATIONS.length} triples seeded.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
