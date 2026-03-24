import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const retiredRouteFiles = [
  "app/(marketing)/analytics/page.tsx",
  "app/(marketing)/pricing/page.tsx",
  "app/(marketing)/preview/page.tsx",
  "app/(marketing)/search/page.tsx",
] as const;

const reachableLeadGenFiles = [
  "app/(marketing)/contact/page.tsx",
  "app/(marketing)/solutions/hr-teams/page.tsx",
  "app/(marketing)/solutions/founders/page.tsx",
  "app/(marketing)/solutions/finance/page.tsx",
  "components/layout/site-nav.tsx",
  "components/layout/site-footer.tsx",
  "components/marketing/contact-form.tsx",
] as const;

describe("retired marketing routes", () => {
  it("redirects retired product pages to /home", () => {
    for (const relativePath of retiredRouteFiles) {
      const absolutePath = path.resolve(process.cwd(), relativePath);
      const source = fs.readFileSync(absolutePath, "utf8");

      expect(source).toContain('redirect("/home")');
    }
  });

  it("keeps reachable lead-gen pages free of retired route links", () => {
    for (const relativePath of reachableLeadGenFiles) {
      const absolutePath = path.resolve(process.cwd(), relativePath);
      const source = fs.readFileSync(absolutePath, "utf8");

      expect(source).not.toContain('href="/search"');
      expect(source).not.toContain('href="/pricing"');
      expect(source).not.toContain('href="/analytics"');
      expect(source).not.toContain('href="/preview"');
    }
  });
});
