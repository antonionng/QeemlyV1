import { describe, expect, it } from "vitest";
import { renderOfferPdf, type OfferPdfData } from "@/lib/offers/pdf-renderer";

function makeOfferPdfData(overrides?: Partial<OfferPdfData>): OfferPdfData {
  return {
    companyName: "Acme Corp",
    companyLogo: null,
    primaryColor: "#5C45FD",
    recipientName: "Jane Doe",
    recipientEmail: "jane@acme.com",
    roleTitle: "Product Manager",
    levelName: "Senior (IC3)",
    locationCity: "Dubai",
    locationCountry: "UAE",
    employmentType: "national",
    targetPercentile: 50,
    offerValue: 240000,
    offerLow: 230400,
    offerHigh: 249600,
    currency: "AED",
    salaryBreakdown: {
      basic: { percent: 60, amount: 144000 },
      housing: { percent: 25, amount: 60000 },
      transport: { percent: 10, amount: 24000 },
      other: { percent: 5, amount: 12000 },
    },
    benchmarkSource: "market",
    confidence: "High",
    createdAt: "2026-04-01T00:00:00.000Z",
    offerMode: "candidate_manual",
    ...overrides,
  };
}

describe("renderOfferPdf", () => {
  it("returns a non-empty Buffer containing PDF magic bytes", async () => {
    const buf = await renderOfferPdf(makeOfferPdfData());
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(100);
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("generates a valid PDF with custom branding color", async () => {
    const buf = await renderOfferPdf(
      makeOfferPdfData({ primaryColor: "#FF6600" }),
    );
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("handles missing recipient email gracefully", async () => {
    const buf = await renderOfferPdf(
      makeOfferPdfData({ recipientEmail: null }),
    );
    expect(buf.length).toBeGreaterThan(100);
  });

  it("handles empty salary breakdown without error", async () => {
    const buf = await renderOfferPdf(
      makeOfferPdfData({ salaryBreakdown: {} }),
    );
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("falls back to default brand color when primaryColor is empty", async () => {
    const buf = await renderOfferPdf(
      makeOfferPdfData({ primaryColor: "" }),
    );
    expect(buf.length).toBeGreaterThan(100);
  });

  it("renders internal mode with current compensation and benchmark snapshot sections", async () => {
    const buf = await renderOfferPdf(
      makeOfferPdfData({
        offerMode: "internal",
        recipientName: "Internal Brief",
        targetEmployee: {
          name: "Sara Al Mansouri",
          department: "Product",
          currentBaseSalary: 180000,
          currentTotalComp: 220000,
          currency: "AED",
        },
        benchmarkPercentiles: {
          p25: 200000,
          p50: 240000,
          p75: 280000,
          p90: 310000,
        },
        benchmarkSampleSize: 42,
        benchmarkLastUpdated: "2026-03-01T00:00:00.000Z",
        internalMetadata: {
          rationale: "Promotion to Senior IC3 with strong recent reviews.",
          band_position: "in-band",
          negotiation_floor: 230000,
          negotiation_ceiling: 260000,
          risk_flags: ["Retention risk"],
          talking_points: ["Highlight new scope"],
        },
      }),
    );
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(buf.length).toBeGreaterThan(500);
  });
});
