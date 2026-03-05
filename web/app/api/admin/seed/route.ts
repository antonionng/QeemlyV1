import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin/auth";

// Endpoint is intentionally disabled in all runtime environments.
export async function POST() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  return NextResponse.json(
    { error: "Seed endpoint is disabled in this environment." },
    { status: 410 },
  );
}
