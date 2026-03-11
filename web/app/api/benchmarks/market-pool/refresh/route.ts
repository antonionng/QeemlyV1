import { NextResponse } from "next/server";
import { refreshPlatformMarketPool } from "@/lib/benchmarks/platform-market-pool";
import { invalidateMarketBenchmarkCache } from "@/lib/benchmarks/platform-market";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await refreshPlatformMarketPool();
    invalidateMarketBenchmarkCache();
    return NextResponse.json({ ok: true, rows: result.rowCount });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to refresh market pool" },
      { status: 500 },
    );
  }
}
