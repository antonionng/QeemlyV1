import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { jsonServerError } from "@/lib/errors/http";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_benchmark_snapshots")
    .select("*")
    .eq("is_public", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not load the public benchmark snapshot right now.",
      logLabel: "Public benchmark snapshot load failed",
    });
  }

  return NextResponse.json({ snapshot: data });
}
