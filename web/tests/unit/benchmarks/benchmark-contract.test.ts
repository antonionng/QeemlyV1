import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getBenchmarkSourceLabel } from "@/lib/benchmarks/trust";

describe("benchmark source contract", () => {
  it("uses only market and uploaded benchmark source labels", () => {
    expect(getBenchmarkSourceLabel({ source: "market" })).toBe("Qeemly Market Dataset");
    expect(getBenchmarkSourceLabel({ source: "uploaded" })).toBe("Company Overlay");
  });

  it("removes dummy benchmark source unions and synthetic labels from core files", () => {
    const files = [
      "lib/dashboard/dummy-data.ts",
      "lib/benchmarks/trust.ts",
      "components/ui/benchmark-source-badge.tsx",
      "lib/offers/types.ts",
      "components/dashboard/benchmarks/drilldown/views/offer-builder-view.tsx",
    ];

    for (const relativePath of files) {
      const source = fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
      expect(source).not.toContain('"dummy"');
      expect(source).not.toContain("Synthetic Benchmark");
    }
  });

  it("does not render benchmark widgets from synthetic featured or geo comparison datasets", () => {
    const files = [
      "components/dashboard/widgets/salary-distribution.tsx",
      "components/dashboard/widgets/trend-analytics.tsx",
      "components/dashboard/widgets/geo-comparison.tsx",
      "components/dashboard/widgets/experience-matrix.tsx",
    ];

    for (const relativePath of files) {
      const source = fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
      expect(source).not.toContain("FEATURED_BENCHMARKS");
      expect(source).not.toContain("GEO_COMPARISON");
      expect(source).not.toContain("getExperienceMatrix");
    }
  });

  it("keeps benchmark drilldown geography Gulf-only", () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "components/dashboard/benchmarks/drilldown/views/geo-view.tsx"),
      "utf8",
    );

    expect(source).not.toContain("United Kingdom");
    expect(source).not.toContain("london");
    expect(source).not.toContain("manchester");
    expect(source).not.toContain('countryCode === "GB"');
  });

  it("keeps bootstrap cleanup and market-source uniqueness aligned with real-source ingestion", () => {
    const cleanupMigration = fs.readFileSync(
      path.resolve(
        process.cwd(),
        "../supabase/migrations/20260312234000_remove_shared_market_bootstrap_rows.sql",
      ),
      "utf8",
    );
    const sourceKeyMigration = fs.readFileSync(
      path.resolve(
        process.cwd(),
        "../supabase/migrations/20260312234500_add_salary_benchmark_source_key.sql",
      ),
      "utf8",
    );
    const workerSource = fs.readFileSync(
      path.resolve(process.cwd(), "lib/ingestion/worker.ts"),
      "utf8",
    );

    expect(cleanupMigration).toContain("DELETE FROM platform_market_benchmarks");
    expect(cleanupMigration).toContain("DELETE FROM public_benchmark_snapshots");
    expect(sourceKeyMigration).toContain("ADD COLUMN IF NOT EXISTS source_key");
    expect(workerSource).toContain("source_key,valid_from");
  });

  it("drops the legacy salary benchmark uniqueness constraint that blocks multi-source market ingestion", () => {
    const migration = fs.readFileSync(
      path.resolve(
        process.cwd(),
        "../supabase/migrations/20260317203000_drop_legacy_salary_benchmark_unique_constraint.sql",
      ),
      "utf8",
    );

    expect(migration).toContain("ALTER TABLE salary_benchmarks");
    expect(migration).toContain(
      "DROP CONSTRAINT IF EXISTS salary_benchmarks_workspace_id_role_id_location_id_level_id_valid_from_key",
    );
    expect(migration).toContain(
      "DROP CONSTRAINT IF EXISTS salary_benchmarks_workspace_id_role_id_location_id_level_id_key",
    );
  });
});
