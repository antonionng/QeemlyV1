import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  resolveBenchmarkLookup,
  type BenchmarkLookupClient,
} from "@/lib/benchmarks/lookup-service";

async function resolveMarketBenchmark(
  supabase: Awaited<ReturnType<typeof createClient>>,
  roleId: string,
  locationId: string,
  levelId: string,
  industry: string | null,
  companySize: string | null,
  diagnostics: {
    market: {
      readMode: "service" | "session";
      clientWarning: string | null;
      error: string | null;
    };
  },
) {
  return resolveBenchmarkLookup(
    supabase as unknown as BenchmarkLookupClient,
    roleId,
    locationId,
    levelId,
    industry,
    companySize,
    diagnostics,
  );
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

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
    },
  };

  const benchmark = await resolveMarketBenchmark(
    supabase,
    roleId,
    locationId,
    levelId,
    industry,
    companySize,
    diagnostics,
  );

  return NextResponse.json({
    benchmark,
    diagnostics,
  });
}
