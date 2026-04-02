import { NextRequest, NextResponse } from "next/server";
import {
  resolveCanonicalBenchmarkLookup,
  type CanonicalBenchmarkDiagnostics,
  type BenchmarkLookupClient,
} from "@/lib/benchmarks/lookup-service";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const roleId = searchParams.get("roleId");
  const locationId = searchParams.get("locationId");
  const levelId = searchParams.get("levelId");
  const industry = searchParams.get("industry");
  const companySize = searchParams.get("companySize");

  if (!roleId || !locationId || !levelId) {
    return NextResponse.json(
      { error: "roleId, locationId, and levelId are required." },
      { status: 400 },
    );
  }

  const diagnostics = {
    market: {
      readMode: "session" as "service" | "session",
      clientWarning: null as string | null,
      error: null as string | null,
      durationMs: null as number | null,
    },
    ai: {
      called: false,
      error: null as string | null,
      durationMs: null as number | null,
    },
    request: {
      totalDurationMs: null as number | null,
    },
  };

  const requestStartedAt = Date.now();
  const resolveStartedAt = Date.now();
  const resolved = await resolveCanonicalBenchmarkLookup(
    supabase as unknown as BenchmarkLookupClient,
    roleId,
    locationId,
    levelId,
    industry,
    companySize,
    diagnostics as CanonicalBenchmarkDiagnostics,
  );
  const resolveDurationMs = Date.now() - resolveStartedAt;
  diagnostics.market.durationMs = resolveDurationMs;
  diagnostics.ai.durationMs = resolveDurationMs;
  diagnostics.request.totalDurationMs = Date.now() - requestStartedAt;

  return NextResponse.json({
    benchmark: resolved.benchmark,
    aiSummary: resolved.aiSummary,
    diagnostics,
  });
}
