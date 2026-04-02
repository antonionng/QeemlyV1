import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  resolveCanonicalBenchmarkLookupBatch,
  type BenchmarkLookupClient,
} from "@/lib/benchmarks/lookup-service";
import {
  makeBenchmarkLookupKey,
  type BenchmarkLookupEntry,
} from "@/lib/benchmarks/data-service";

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

  const benchmarks = await resolveCanonicalBenchmarkLookupBatch(
    supabase as unknown as BenchmarkLookupClient,
    entries,
  );

  return NextResponse.json({
    benchmarks: Object.fromEntries(
      entries.map((entry) => [makeBenchmarkLookupKey(entry), benchmarks[makeBenchmarkLookupKey(entry)] ?? null] as const),
    ),
  });
}
