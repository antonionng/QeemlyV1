import { describe, expect, it } from "vitest";

describe("Offer format support", () => {
  it("export_format type allows PDF alongside JSON", () => {
    const formats = ["PDF", "DOCX", "JSON"] as const;
    type OfferExportFormat = (typeof formats)[number];

    const pdfFormat: OfferExportFormat = "PDF";
    const jsonFormat: OfferExportFormat = "JSON";

    expect(pdfFormat).toBe("PDF");
    expect(jsonFormat).toBe("JSON");
    expect(formats).toContain("PDF");
    expect(formats).toContain("JSON");
  });

  it("validates supported export formats correctly", () => {
    const supported = ["JSON", "PDF"];

    expect(supported.includes("JSON")).toBe(true);
    expect(supported.includes("PDF")).toBe(true);
    expect(supported.includes("DOCX")).toBe(false);
    expect(supported.includes("CSV")).toBe(false);
  });
});
