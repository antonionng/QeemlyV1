import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { jsonServerError } from "@/lib/errors/http";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("relocation_city_costs")
    .select("*")
    .order("region", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not load relocation city data right now.",
      logLabel: "Relocation cities load failed",
    });
  }

  return NextResponse.json({ cities: data || [] });
}
