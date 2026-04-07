import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const toggleViewMock = vi.fn();
const selectAllMock = vi.fn();
const resetToDefaultMock = vi.fn();
const setSalaryViewMock = vi.fn();

vi.mock("@/lib/benchmarks/drilldown-views", () => ({
  DRILLDOWN_VIEWS: [
    {
      id: "level-table",
      label: "Level Data",
      icon: () => React.createElement("svg", { "aria-hidden": true }),
    },
  ],
  filterDrilldownViewsForCompanyData: (views: Array<unknown>) => views,
  useDrilldownPreferences: () => ({
    enabledViews: ["level-table"],
    toggleView: toggleViewMock,
    selectAll: selectAllMock,
    resetToDefault: resetToDefaultMock,
  }),
}));

vi.mock("@/lib/salary-view-store", () => ({
  useSalaryView: () => ({
    salaryView: "annual" as const,
    setSalaryView: setSalaryViewMock,
  }),
}));

import { ViewSelector } from "@/components/dashboard/benchmarks/drilldown/view-selector";

describe("ViewSelector", () => {
  it("stacks the salary view label and toggle in the sidebar so both options fit", () => {
    const html = renderToStaticMarkup(React.createElement(ViewSelector));

    expect(html).toContain('class="flex flex-col items-stretch gap-2"');
    expect(html).toContain('class="bench-toggle w-full text-xs"');
    expect(html).toContain(">Annual<");
    expect(html).toContain(">Monthly<");
  });
});
