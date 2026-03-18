import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapMarketPublishEventRow } from "@/lib/benchmarks/market-publish";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("market_publish_events")
    .select("id, title, summary, row_count, published_at")
    .eq("tenant_visible", true)
    .order("published_at", { ascending: false })
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const latest = data?.[0];
  return NextResponse.json({
    event: latest ? mapMarketPublishEventRow(latest as Record<string, unknown>) : null,
  });
}
