import { describe, expect, it } from "vitest";
import { validateRuntimeEnv } from "@/lib/config/env";

describe("validateRuntimeEnv", () => {
  it("returns missing required keys", () => {
    const result = validateRuntimeEnv(
      {
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      },
      { requireCronSecret: true, requireAI: true, requirePlatformWorkspace: true }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missing).toContain("SUPABASE_SERVICE_ROLE_KEY");
      expect(result.missing).toContain("CRON_SECRET");
      expect(result.missing).toContain("OPENAI_API_KEY");
      expect(result.missing).toContain("PLATFORM_WORKSPACE_ID");
    }
  });

  it("passes when all required keys are present", () => {
    const result = validateRuntimeEnv(
      {
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "service-role",
        CRON_SECRET: "cron-secret",
        OPENAI_API_KEY: "openai-key",
        PLATFORM_WORKSPACE_ID: "platform-workspace",
      },
      { requireCronSecret: true, requireAI: true, requirePlatformWorkspace: true }
    );

    expect(result.ok).toBe(true);
  });
});
