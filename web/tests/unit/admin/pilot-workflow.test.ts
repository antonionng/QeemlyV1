import { describe, expect, it } from "vitest";
import { buildManualAdminBenchmarkPayload } from "@/lib/admin/research/pilot-workflow";

describe("buildManualAdminBenchmarkPayload", () => {
  it("maps executive Robert Walters titles onto Qeemly role and level keys", () => {
    const payload = buildManualAdminBenchmarkPayload(
      {
        id: "row-1",
        role_title: "Chief Product Officer",
        location_hint: "Dubai",
        level_hint: "VP",
        currency: "AED",
        pay_period: "monthly",
        salary_2026_min: 70_000,
        salary_2026_max: 100_000,
        function_name: "Technology",
        parse_confidence: "high",
      },
      "workspace-1",
    );

    expect("ok" in payload).toBe(true);
    if ("ok" in payload) {
      expect(payload.ok.role_id).toBe("pm");
      expect(payload.ok.level_id).toBe("vp");
      expect(payload.ok.pay_period).toBe("monthly");
    }
  });

  it("maps transformation titles onto the technical program manager role", () => {
    const payload = buildManualAdminBenchmarkPayload(
      {
        id: "row-2",
        role_title: "Head of Digital Transformation/Digital Director",
        location_hint: "Dubai",
        level_hint: "Director",
        currency: "AED",
        pay_period: "monthly",
        salary_2026_min: 70_000,
        salary_2026_max: 90_000,
        function_name: "Technology",
        parse_confidence: "high",
      },
      "workspace-1",
    );

    expect("ok" in payload).toBe(true);
    if ("ok" in payload) {
      expect(payload.ok.role_id).toBe("tpm");
      expect(payload.ok.level_id).toBe("d1");
    }
  });
});
