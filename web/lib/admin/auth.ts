import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ALLOWLIST = (process.env.QEEMLY_SUPERADMINS || "ag@experrt.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

export async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const email = user.email?.toLowerCase();
  if (!email || !ALLOWLIST.includes(email)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}
