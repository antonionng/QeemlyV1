// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  InputPanel,
  type RelocationFormData,
} from "@/components/dashboard/relocation/input-panel";

describe("InputPanel country selectors", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
  });

  it("updates the selected city when the home country changes", async () => {
    const root = createRoot(container);
    const onChange = vi.fn();
    const data: RelocationFormData = {
      homeCityId: "london",
      targetCityId: "dubai",
      baseSalary: 95_000,
      compApproach: "hybrid",
      hybridCap: 110,
      roleId: "swe",
      levelId: "ic3",
    };

    await act(async () => {
      root.render(
        React.createElement(InputPanel, {
          data,
          onChange,
          onRunAnalysis: () => {},
          isAnalysisPending: false,
          isAnalyzing: false,
        }),
      );
    });

    const homeCountrySelect = container.querySelector(
      'select[name="home-country"]',
    ) as HTMLSelectElement | null;

    expect(homeCountrySelect).toBeTruthy();
    expect(container.textContent).toContain("(GBP)");

    await act(async () => {
      homeCountrySelect!.value = "UAE";
      homeCountrySelect!.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        homeCityId: "abu-dhabi",
      }),
    );
  });
});
