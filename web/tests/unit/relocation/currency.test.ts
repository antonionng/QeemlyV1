import { describe, expect, it } from "vitest";

import {
  buildRelocationDisplayMoney,
  convertRelocationCurrency,
  formatRelocationCurrency,
} from "@/lib/relocation/currency";

describe("relocation currency helpers", () => {
  it("formats GBP values in local currency", () => {
    expect(formatRelocationCurrency(95_000, "GBP")).toContain("95,000");
    expect(formatRelocationCurrency(95_000, "GBP")).toMatch(/[£GBP]/);
  });

  it("formats AED values in local currency", () => {
    expect(formatRelocationCurrency(320_000, "AED")).toContain("320,000");
    expect(formatRelocationCurrency(320_000, "AED")).toContain("AED");
  });

  it("builds a primary local value and a secondary AED reference", () => {
    const display = buildRelocationDisplayMoney(95_000, "GBP");

    expect(display.primary).toContain("95,000");
    expect(display.primary).toMatch(/[£GBP]/);
    expect(display.secondaryAed).toContain("AED");
    expect(display.secondaryAed).not.toContain("95,000");
  });

  it("falls back safely when currency metadata is missing", () => {
    const display = buildRelocationDisplayMoney(12_500, null);

    expect(display.primary).toBe("12,500");
    expect(display.secondaryAed).toBeNull();
  });

  it("converts between local currency and AED for cross-market references", () => {
    expect(Math.round(convertRelocationCurrency(100, "GBP", "AED"))).toBe(465);
    expect(Math.round(convertRelocationCurrency(320_000, "AED", "AED"))).toBe(320_000);
  });
});
