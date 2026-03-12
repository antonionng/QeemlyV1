import { describe, expect, it } from "vitest";
import {
  ADMIN_NAV_GROUPS,
  LEGACY_ADMIN_ROUTE_REDIRECTS,
} from "@/lib/admin/navigation";

describe("admin navigation", () => {
  it("groups the admin shell around platform admin and market data workbench jobs", () => {
    expect(
      ADMIN_NAV_GROUPS.map((group) => ({
        heading: group.heading,
        labels: group.items.map((item) => item.label),
      })),
    ).toEqual([
      {
        heading: "Overview",
        labels: ["Platform Overview"],
      },
      {
        heading: "Platform Administration",
        labels: ["Tenants", "Users"],
      },
      {
        heading: "Market Data Workbench",
        labels: [
          "Workbench Home",
          "Sources",
          "Runs",
          "Inbox",
          "Snapshots",
          "Review & Normalize",
          "Freshness & Quality",
          "Benchmarks",
          "Publish",
        ],
      },
    ]);
  });

  it("demotes legacy top-level routes that no longer belong in the primary nav", () => {
    expect(LEGACY_ADMIN_ROUTE_REDIRECTS).toEqual({
      "/admin/insights": "/admin",
      "/admin/pipeline": "/admin/workbench",
    });

    const labels = ADMIN_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.label));
    expect(labels).not.toContain("Billing");
    expect(labels).not.toContain("Insights");
    expect(labels).not.toContain("Data Pipeline");
  });
});
