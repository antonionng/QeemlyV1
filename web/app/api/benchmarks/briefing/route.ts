import { NextRequest, NextResponse } from "next/server";
import { getAiBenchmarkDetailBriefing } from "@/lib/benchmarks/ai-estimate";
import { createClient } from "@/lib/supabase/server";

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

  const detailBriefing = await getAiBenchmarkDetailBriefing(
    roleId,
    locationId,
    industry,
    companySize,
  );

  return NextResponse.json({
    detailBriefing,
  });
}
