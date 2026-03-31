import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  resolveBenchmarkLookup,
  type BenchmarkLookupClient,
} from "@/lib/benchmarks/lookup-service";
import {
  makeBenchmarkLookupKey,
  type BenchmarkLookupEntry,
} from "@/lib/benchmarks/data-service";

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

type RequestBody = {
  entries?: BenchmarkLookupEntry[];
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as RequestBody | null;
  const entries = Array.isArray(body?.entries) ? body.entries : [];

  if (entries.length === 0) {
    return NextResponse.json(
      { error: "entries are required." },
      { status: 400 },
    );
  }

  const results = await Promise.all(
    entries.map(async (entry) => {
      const diagnostics = {
        market: {
          readMode: "session" as "service" | "session",
          clientWarning: null as string | null,
          error: null as string | null,
        },
      };

      const benchmark = await resolveMarketBenchmark(
        supabase,
        entry.roleId,
        entry.locationId,
        entry.levelId,
        entry.industry ?? null,
        entry.companySize ?? null,
        diagnostics,
      );

      return [makeBenchmarkLookupKey(entry), benchmark] as const;
    }),
  );

  return NextResponse.json({
    benchmarks: Object.fromEntries(results),
  });
}
