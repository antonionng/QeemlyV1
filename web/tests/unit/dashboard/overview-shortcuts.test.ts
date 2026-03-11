import { describe, expect, it } from "vitest";
import {
  getOverviewShortcutGuidance,
  OVERVIEW_SHORTCUTS,
} from "@/lib/dashboard/overview-shortcuts";

describe("overview shortcuts", () => {
  it("includes an import company data shortcut on the company overview page", () => {
    expect(OVERVIEW_SHORTCUTS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "import-company-data",
          title: "Import Company Data",
          href: "/dashboard/upload",
        }),
      ]),
    );
  });

  it("explains that imports can be incremental or replace the current roster", () => {
    expect(getOverviewShortcutGuidance()).toContain("incremental updates");
    expect(getOverviewShortcutGuidance()).toContain("replace your current roster");
  });
});
