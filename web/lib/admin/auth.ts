import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isSuperAdminEmail } from "@/lib/admin/super-admins";

export async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const email = user.email?.toLowerCase();
  if (!isSuperAdminEmail(email)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}
