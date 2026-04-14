import { describe, expect, it } from "vitest";

import { calculateRelocation } from "@/lib/relocation/calculator";

describe("calculateRelocation", () => {
  it("converts the home salary into AED before applying COL math", () => {
    const result = calculateRelocation({
      homeCityId: "london",
      targetCityId: "dubai",
      baseSalary: 100_000,
      compApproach: "purchasing-power",
    });

    expect(result).not.toBeNull();
    expect(result?.baseSalary).toBe(100_000);
    expect(result?.baseSalaryCurrency).toBe("GBP");
    expect(result?.baseSalaryAed).toBe(465_000);
    expect(result?.purchasingPowerSalary).toBe(320_690);
    expect(result?.recommendedSalary).toBe(320_690);
  });
});
