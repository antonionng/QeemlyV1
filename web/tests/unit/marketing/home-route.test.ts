import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("home route ownership", () => {
  it("moves /home into a dedicated route group while keeping marketing root redirect", () => {
    const dedicatedHomePath = path.resolve(process.cwd(), "app/(home)/home/page.tsx");
    const legacyHomePath = path.resolve(process.cwd(), "app/(marketing)/home/page.tsx");
    const marketingRootPath = path.resolve(process.cwd(), "app/(marketing)/page.tsx");

    expect(fs.existsSync(dedicatedHomePath)).toBe(true);
    expect(fs.existsSync(legacyHomePath)).toBe(false);
    expect(fs.readFileSync(marketingRootPath, "utf8")).toContain('redirect("/home")');
  });
});
