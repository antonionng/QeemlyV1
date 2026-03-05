import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("tenant isolation guardrails", () => {
  it("scopes integration mutations by workspace_id", () => {
    const route = read("app/api/integrations/[id]/route.ts");
    expect(route).toContain('.eq("workspace_id", workspaceId)');
  });

  it("scopes webhook mutations by workspace_id", () => {
    const route = read("app/api/developer/webhooks/route.ts");
    expect(route).toContain('.eq("workspace_id", profile.workspace_id)');
  });

  it("requires signed OAuth state for callback", () => {
    const callback = read("app/api/integrations/callback/route.ts");
    expect(callback).toContain("verifyOAuthState");
  });

  it("keeps seed endpoint disabled and sample adapter removed", () => {
    const seedRoutePath = path.resolve(process.cwd(), "app/api/admin/seed/route.ts");
    const sampleAdapterPath = path.resolve(process.cwd(), "lib/ingestion/adapters/sample-market.ts");
    expect(fs.existsSync(seedRoutePath)).toBe(true);
    const seedRoute = fs.readFileSync(seedRoutePath, "utf8");
    expect(seedRoute).toContain("status: 410");
    expect(fs.existsSync(sampleAdapterPath)).toBe(false);
  });
});
