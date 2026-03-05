import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for server-side operations that bypass RLS.
 * Use only in trusted contexts (cron, admin APIs, background workers).
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for service client usage.");
  }
  return createClient(url, key);
}
