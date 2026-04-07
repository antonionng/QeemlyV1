import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createClientMock,
  getAiBenchmarkDetailBriefingMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getAiBenchmarkDetailBriefingMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/benchmarks/ai-estimate", () => ({
  getAiBenchmarkDetailBriefing: getAiBenchmarkDetailBriefingMock,
}));

import { GET } from "@/app/api/benchmarks/briefing/route";

const DETAIL_BRIEFING = {
  executiveBriefing: "Shared AI executive market view.",
  hiringSignal: "Hiring remains competitive for this role.",
  negotiationPosture: "Keep room for movement at final offer stage.",
  views: {
    levelTable: { summary: "Level spacing remains healthy through IC4.", action: "Use the selected band as the anchor." },
    aiInsights: { summary: "Above-median positioning will improve close rates.", action: "Stay disciplined around the target percentile." },
    trend: { summary: "Momentum remains positive in the latest data window.", action: "Avoid assuming near-term cooling." },
    salaryBreakdown: { summary: "Candidates react best to a clear cash-led package.", action: "Keep allowances easy to explain." },
    industry: { summary: "Fintech keeps a persistent premium in this market.", action: "Expect comp references above general market norms." },
    companySize: { summary: "Structured mid-market bands are still competitive.", action: "Use policy clarity as a differentiator." },
    geoComparison: { summary: "Regional market gaps remain meaningful.", action: "Benchmark relocation cases separately." },
    compMix: { summary: "Most value is concentrated in fixed cash.", action: "Avoid unnecessary package complexity." },
    offerBuilder: { summary: "A decisive first offer still matters.", action: "Hold a small negotiation buffer in reserve." },
  },
};

describe("GET /api/benchmarks/briefing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
    });
  });

  it("returns the full detail briefing for the requested benchmark", async () => {
    getAiBenchmarkDetailBriefingMock.mockResolvedValue(DETAIL_BRIEFING);

    const request = new Request(
      "http://localhost/api/benchmarks/briefing?roleId=swe-devops&locationId=dubai&levelId=ic2&industry=Fintech&companySize=201-500",
    ) as unknown as Parameters<typeof GET>[0];

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(getAiBenchmarkDetailBriefingMock).toHaveBeenCalledWith(
      "swe-devops",
      "dubai",
      "Fintech",
      "201-500",
    );
    expect(payload.detailBriefing).toEqual(DETAIL_BRIEFING);
  });

  it("returns unauthorized for anonymous users", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    });

    const request = new Request(
      "http://localhost/api/benchmarks/briefing?roleId=swe-devops&locationId=dubai&levelId=ic2",
    ) as unknown as Parameters<typeof GET>[0];

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Unauthorized");
  });

  it("returns a 503 when AI detail briefing cannot be generated", async () => {
    getAiBenchmarkDetailBriefingMock.mockResolvedValue(null);

    const request = new Request(
      "http://localhost/api/benchmarks/briefing?roleId=swe-devops&locationId=dubai&levelId=ic2",
    ) as unknown as Parameters<typeof GET>[0];

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error).toBe("AI detail briefing unavailable");
    expect(payload.reasonCode).toBe("briefing_generation_failed");
  });
});
