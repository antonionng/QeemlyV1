import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import type { OfferMode, InternalOfferMetadata, AdvisedBaseline } from "./types";

export type OfferPdfData = {
  companyName: string;
  companyLogo: string | null;
  primaryColor: string;
  recipientName: string;
  recipientEmail: string | null;
  roleTitle: string;
  levelName: string;
  locationCity: string;
  locationCountry: string;
  employmentType: string;
  targetPercentile: number;
  offerValue: number;
  offerLow: number;
  offerHigh: number;
  currency: string;
  salaryBreakdown: Record<string, { percent: number; amount: number }>;
  benchmarkSource: string;
  confidence: string;
  createdAt: string;
  offerMode: OfferMode;
  internalMetadata?: InternalOfferMetadata;
  advisedBaseline?: AdvisedBaseline | null;
  // Optional internal-mode enrichments. When `targetEmployee` is present the internal PDF
  // renders the Current Compensation section. When `benchmarkPercentiles` is provided we
  // render the Benchmark Snapshot section.
  targetEmployee?: {
    name: string;
    email?: string | null;
    department?: string | null;
    currentTotalComp?: number | null;
    currentBaseSalary?: number | null;
    currency?: string | null;
    roleTitle?: string | null;
    levelName?: string | null;
  } | null;
  benchmarkPercentiles?: {
    p25?: number | null;
    p50?: number | null;
    p75?: number | null;
    p90?: number | null;
  } | null;
  benchmarkSampleSize?: number | null;
  benchmarkLastUpdated?: string | null;
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  GBP: "\u00A3",
  EUR: "\u20AC",
  AED: "AED ",
  SAR: "SAR ",
};

function currencyFormat(value: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || `${currency} `;
  return `${symbol}${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = (hex || "#5C45FD").replace("#", "");
  if (clean.length < 6) return [92, 69, 253];
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return [92, 69, 253];
  return [r, g, b];
}

function renderCandidatePdf(doc: PDFKit.PDFDocument, data: OfferPdfData) {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const brandColor = hexToRgb(data.primaryColor || "#5C45FD");
  const left = doc.page.margins.left;
  const logoPath = path.join(process.cwd(), "public", "logo.png");

  doc.rect(0, 0, doc.page.width, 8).fill(brandColor);

  if (fs.existsSync(logoPath)) {
    const logoHeight = 24;
    const logoWidth = Math.round(logoHeight * (2791 / 1093));
    doc.image(logoPath, left + pageWidth - logoWidth, 28, { height: logoHeight });
  }

  doc.moveDown(1);

  doc.font("Helvetica-Bold").fontSize(22).fillColor(brandColor).text(data.companyName, left, 40);
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(11).fillColor("#666666").text("COMPENSATION OFFER", left);
  doc.moveDown(1.5);

  const divY = doc.y;
  doc.moveTo(left, divY).lineTo(left + pageWidth, divY).strokeColor("#E5E7EB").lineWidth(1).stroke();
  doc.moveDown(1);

  doc.font("Helvetica-Bold").fontSize(9).fillColor("#9CA3AF").text("PREPARED FOR", left);
  doc.font("Helvetica-Bold").fontSize(16).fillColor("#111827").text(data.recipientName, left);
  if (data.recipientEmail) {
    doc.font("Helvetica").fontSize(10).fillColor("#6B7280").text(data.recipientEmail, left);
  }
  doc.moveDown(1.2);

  renderPositionBox(doc, data, left, pageWidth);
  renderCompensationSection(doc, data, left, pageWidth, brandColor);
  renderBreakdownSection(doc, data, left, pageWidth, brandColor);

  if (data.offerMode === "candidate_advised" && data.advisedBaseline) {
    const bl = data.advisedBaseline;
    const wasEdited = bl.recommended_value !== data.offerValue;
    if (wasEdited) {
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#9CA3AF").text("QEEMLY RECOMMENDATION", left);
      doc.moveDown(0.3);
      doc.font("Helvetica").fontSize(9).fillColor("#6B7280")
        .text(
          `Original recommended value: ${currencyFormat(bl.recommended_value, data.currency)} at P${bl.recommended_percentile}`,
          left,
        );
      doc.moveDown(0.8);
    }
  }

  renderFooter(doc, data, left, pageWidth, brandColor, logoPath);
}

function renderInternalPdf(doc: PDFKit.PDFDocument, data: OfferPdfData) {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const brandColor = hexToRgb(data.primaryColor || "#5C45FD");
  const left = doc.page.margins.left;
  const logoPath = path.join(process.cwd(), "public", "logo.png");

  const internalAccent: [number, number, number] = [217, 119, 6];
  doc.rect(0, 0, doc.page.width, 8).fill(internalAccent);

  if (fs.existsSync(logoPath)) {
    const logoHeight = 24;
    const logoWidth = Math.round(logoHeight * (2791 / 1093));
    doc.image(logoPath, left + pageWidth - logoWidth, 28, { height: logoHeight });
  }

  doc.moveDown(1);

  doc.font("Helvetica-Bold").fontSize(22).fillColor(brandColor).text(data.companyName, left, 40);
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(11).fillColor("#92400E").text("INTERNAL COMPENSATION BRIEF", left);
  doc.font("Helvetica").fontSize(8).fillColor("#B45309").text("CONFIDENTIAL - NOT FOR EXTERNAL DISTRIBUTION", left);
  doc.moveDown(1.5);

  const divY = doc.y;
  doc.moveTo(left, divY).lineTo(left + pageWidth, divY).strokeColor("#E5E7EB").lineWidth(1).stroke();
  doc.moveDown(1);

  renderPositionBox(doc, data, left, pageWidth);

  if (data.targetEmployee) {
    renderCurrentCompensationSection(doc, data, left, pageWidth);
  }

  if (data.benchmarkPercentiles) {
    renderBenchmarkSnapshotSection(doc, data, left, pageWidth);
  }

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#92400E").text("PROPOSED OFFER", left);
  doc.moveDown(0.4);
  renderCompensationSection(doc, data, left, pageWidth, brandColor);
  renderBreakdownSection(doc, data, left, pageWidth, brandColor);

  const meta = data.internalMetadata;
  if (meta) {
    doc.moveDown(0.5);
    const sectionHeaderY = doc.y;
    doc.moveTo(left, sectionHeaderY).lineTo(left + pageWidth, sectionHeaderY).strokeColor("#F59E0B").lineWidth(1).stroke();
    doc.moveDown(0.8);

    doc.font("Helvetica-Bold").fontSize(10).fillColor("#92400E").text("INTERNAL ANALYSIS", left);
    doc.moveDown(0.6);

    if (meta.band_position) {
      const posLabel = meta.band_position === "below" ? "Below Band" : meta.band_position === "in-band" ? "In Band" : "Above Band";
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#9CA3AF").text("BAND POSITION", left);
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text(posLabel, left);
      doc.moveDown(0.5);
    }

    if (meta.negotiation_floor != null || meta.negotiation_ceiling != null) {
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#9CA3AF").text("NEGOTIATION GUARDRAILS", left);
      const floorText = meta.negotiation_floor != null ? currencyFormat(meta.negotiation_floor, data.currency) : "N/A";
      const ceilText = meta.negotiation_ceiling != null ? currencyFormat(meta.negotiation_ceiling, data.currency) : "N/A";
      doc.font("Helvetica").fontSize(10).fillColor("#111827").text(`Floor: ${floorText}  |  Ceiling: ${ceilText}`, left);
      doc.moveDown(0.5);
    }

    if (meta.rationale) {
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#9CA3AF").text("RATIONALE", left);
      doc.font("Helvetica").fontSize(10).fillColor("#374151").text(meta.rationale, left, undefined, { width: pageWidth });
      doc.moveDown(0.5);
    }

    if (meta.risk_flags && meta.risk_flags.length > 0) {
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#9CA3AF").text("RISK FLAGS", left);
      doc.moveDown(0.2);
      for (const flag of meta.risk_flags) {
        doc.font("Helvetica").fontSize(9).fillColor("#991B1B").text(`  \u2022  ${flag}`, left, undefined, { width: pageWidth });
      }
      doc.moveDown(0.5);
    }

    if (meta.talking_points && meta.talking_points.length > 0) {
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#9CA3AF").text("TALKING POINTS", left);
      doc.moveDown(0.2);
      for (const point of meta.talking_points) {
        doc.font("Helvetica").fontSize(9).fillColor("#374151").text(`  \u2022  ${point}`, left, undefined, { width: pageWidth });
      }
      doc.moveDown(0.5);
    }

    if (meta.approval_notes) {
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#9CA3AF").text("APPROVAL NOTES", left);
      doc.font("Helvetica").fontSize(10).fillColor("#374151").text(meta.approval_notes, left, undefined, { width: pageWidth });
      doc.moveDown(0.5);
    }
  }

  renderFooter(doc, data, left, pageWidth, internalAccent, logoPath);
}

function renderPositionBox(doc: PDFKit.PDFDocument, data: OfferPdfData, left: number, pageWidth: number) {
  const detailBoxY = doc.y;
  doc.roundedRect(left, detailBoxY, pageWidth, 80, 6).fillColor("#F9FAFB").fill();

  const col1X = left + 16;
  const col2X = left + pageWidth * 0.35;
  const col3X = left + pageWidth * 0.65;

  doc.font("Helvetica").fontSize(8).fillColor("#9CA3AF").text("ROLE", col1X, detailBoxY + 14);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text(data.roleTitle, col1X, detailBoxY + 28, { width: pageWidth * 0.3 });

  doc.font("Helvetica").fontSize(8).fillColor("#9CA3AF").text("LEVEL", col2X, detailBoxY + 14);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text(data.levelName, col2X, detailBoxY + 28);

  doc.font("Helvetica").fontSize(8).fillColor("#9CA3AF").text("LOCATION", col3X, detailBoxY + 14);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text(
    `${data.locationCity}, ${data.locationCountry}`,
    col3X,
    detailBoxY + 28,
    { width: pageWidth * 0.3 },
  );

  doc.font("Helvetica").fontSize(8).fillColor("#9CA3AF").text("TYPE", col1X, detailBoxY + 50);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text(
    data.employmentType === "expat" ? "Expat" : "National",
    col1X,
    detailBoxY + 64,
  );

  doc.y = detailBoxY + 100;
}

function renderCompensationSection(
  doc: PDFKit.PDFDocument,
  data: OfferPdfData,
  left: number,
  pageWidth: number,
  brandColor: [number, number, number],
) {
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#9CA3AF").text("COMPENSATION PACKAGE", left);
  doc.moveDown(0.5);

  const offerBoxY = doc.y;
  doc.roundedRect(left, offerBoxY, pageWidth, 70, 6).fillColor(brandColor).fill();
  doc.font("Helvetica").fontSize(9).fillColor([255, 255, 255]).text("TOTAL ANNUAL COMPENSATION", left + 20, offerBoxY + 14);
  doc.font("Helvetica-Bold").fontSize(28).fillColor([255, 255, 255]).text(
    currencyFormat(data.offerValue, data.currency),
    left + 20,
    offerBoxY + 30,
  );
  doc.y = offerBoxY + 86;

  const rangeY = doc.y;
  const halfWidth = (pageWidth - 12) / 2;

  doc.roundedRect(left, rangeY, halfWidth, 50, 4).fillColor("#F9FAFB").fill();
  doc.font("Helvetica").fontSize(8).fillColor("#9CA3AF").text("TARGET PERCENTILE", left + 12, rangeY + 10);
  doc.font("Helvetica-Bold").fontSize(14).fillColor("#111827").text(`P${data.targetPercentile}`, left + 12, rangeY + 26);

  doc.roundedRect(left + halfWidth + 12, rangeY, halfWidth, 50, 4).fillColor("#F9FAFB").fill();
  doc.font("Helvetica").fontSize(8).fillColor("#9CA3AF").text("NEGOTIATION RANGE", left + halfWidth + 24, rangeY + 10);
  doc.font("Helvetica-Bold").fontSize(14).fillColor("#111827").text(
    `${currencyFormat(data.offerLow, data.currency)} - ${currencyFormat(data.offerHigh, data.currency)}`,
    left + halfWidth + 24,
    rangeY + 26,
  );
  doc.y = rangeY + 66;
}

function renderBreakdownSection(
  doc: PDFKit.PDFDocument,
  data: OfferPdfData,
  left: number,
  pageWidth: number,
  brandColor: [number, number, number],
) {
  const breakdownEntries = Object.entries(data.salaryBreakdown).filter(
    ([key, val]) => key !== "total_compensation" && val && typeof val === "object" && (val as { percent: number }).percent > 0,
  );

  if (breakdownEntries.length > 0) {
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#9CA3AF").text("PACKAGE BREAKDOWN", left);
    doc.moveDown(0.4);

    for (const [key, val] of breakdownEntries) {
      const entry = val as { percent: number; amount: number };
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      const rowY = doc.y;

      doc.font("Helvetica").fontSize(10).fillColor("#374151").text(`${label} (${entry.percent}%)`, left, rowY);
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827").text(
        currencyFormat(entry.amount, data.currency),
        left + pageWidth - 120,
        rowY,
        { width: 120, align: "right" },
      );
      doc.moveDown(0.3);

      const barY = doc.y;
      doc.roundedRect(left, barY, pageWidth, 4, 2).fillColor("#F3F4F6").fill();
      doc.roundedRect(left, barY, pageWidth * (entry.percent / 100), 4, 2).fillColor(brandColor).fill();
      doc.y = barY + 14;
    }
  }

  doc.moveDown(1);
}

function renderFooter(
  doc: PDFKit.PDFDocument,
  data: OfferPdfData,
  left: number,
  pageWidth: number,
  accentColor: [number, number, number],
  logoPath: string,
) {
  const footerDivY = doc.y;
  doc.moveTo(left, footerDivY).lineTo(left + pageWidth, footerDivY).strokeColor("#E5E7EB").lineWidth(1).stroke();
  doc.moveDown(0.6);

  const generatedDate = new Date(data.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.font("Helvetica").fontSize(8).fillColor("#9CA3AF").text(
    `Confidence: ${data.confidence}  |  Generated: ${generatedDate}`,
    left,
  );
  doc.moveDown(1.2);

  const certY = doc.y;
  doc.roundedRect(left, certY, pageWidth, 48, 4).fillColor("#F9FAFB").fill();

  const badgeLogoX = left + 16;
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, badgeLogoX, certY + 12, { height: 16 });
  }

  const textX = badgeLogoX + 60;
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#374151").text("Salary Benchmarked & Certified", textX, certY + 11);
  doc.font("Helvetica").fontSize(7.5).fillColor("#9CA3AF").text(
    "qeemly.com  |  The GCC compensation intelligence standard",
    textX,
    certY + 26,
  );

  doc.rect(0, doc.page.height - 8, doc.page.width, 8).fill(accentColor);
}

function renderCurrentCompensationSection(
  doc: PDFKit.PDFDocument,
  data: OfferPdfData,
  left: number,
  pageWidth: number,
) {
  const employee = data.targetEmployee;
  if (!employee) return;
  const currency = employee.currency || data.currency;

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#92400E").text("CURRENT COMPENSATION", left);
  doc.moveDown(0.4);

  const boxY = doc.y;
  doc.roundedRect(left, boxY, pageWidth, 78, 6).fillColor("#FFF7ED").fill();

  const col1 = left + 16;
  const col2 = left + pageWidth * 0.5;

  doc.font("Helvetica").fontSize(8).fillColor("#9CA3AF").text("EMPLOYEE", col1, boxY + 12);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text(employee.name, col1, boxY + 26, {
    width: pageWidth * 0.45,
  });
  if (employee.department) {
    doc.font("Helvetica").fontSize(9).fillColor("#6B7280").text(employee.department, col1, boxY + 44);
  }

  doc.font("Helvetica").fontSize(8).fillColor("#9CA3AF").text("CURRENT TOTAL COMP", col2, boxY + 12);
  doc.font("Helvetica-Bold").fontSize(14).fillColor("#111827").text(
    employee.currentTotalComp != null ? currencyFormat(employee.currentTotalComp, currency) : "N/A",
    col2,
    boxY + 26,
  );
  if (employee.currentBaseSalary != null) {
    doc.font("Helvetica").fontSize(8).fillColor("#6B7280").text(
      `Basic ${currencyFormat(employee.currentBaseSalary, currency)}`,
      col2,
      boxY + 50,
    );
  }

  doc.y = boxY + 92;
}

function renderBenchmarkSnapshotSection(
  doc: PDFKit.PDFDocument,
  data: OfferPdfData,
  left: number,
  pageWidth: number,
) {
  const pcts = data.benchmarkPercentiles;
  if (!pcts) return;

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#92400E").text("BENCHMARK SNAPSHOT", left);
  doc.moveDown(0.4);

  const boxY = doc.y;
  doc.roundedRect(left, boxY, pageWidth, 78, 6).fillColor("#F9FAFB").fill();

  const cellWidth = pageWidth / 4;
  const labels: Array<{ key: keyof typeof pcts; label: string }> = [
    { key: "p25", label: "P25" },
    { key: "p50", label: "P50" },
    { key: "p75", label: "P75" },
    { key: "p90", label: "P90" },
  ];

  labels.forEach(({ key, label }, i) => {
    const x = left + cellWidth * i;
    doc.font("Helvetica").fontSize(8).fillColor("#9CA3AF").text(label, x + 12, boxY + 12);
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#111827").text(
      pcts[key] != null ? currencyFormat(pcts[key]!, data.currency) : "-",
      x + 12,
      boxY + 26,
      { width: cellWidth - 16 },
    );
  });

  const trustBits: string[] = [];
  if (data.benchmarkSource) trustBits.push(`Source: ${data.benchmarkSource}`);
  if (data.confidence) trustBits.push(`Confidence: ${data.confidence}`);
  if (data.benchmarkSampleSize != null) trustBits.push(`Sample: ${data.benchmarkSampleSize}`);
  if (data.benchmarkLastUpdated) {
    const updated = new Date(data.benchmarkLastUpdated);
    if (!isNaN(updated.valueOf())) {
      trustBits.push(`Updated: ${updated.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`);
    }
  }
  doc.font("Helvetica").fontSize(8).fillColor("#6B7280").text(trustBits.join("  |  "), left + 12, boxY + 56);

  doc.y = boxY + 92;
}

export async function renderOfferPdf(data: OfferPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 60, bottom: 60, left: 50, right: 50 },
      info: {
        Title: data.offerMode === "internal"
          ? `Internal Brief - ${data.roleTitle}`
          : `Offer - ${data.recipientName} - ${data.roleTitle}`,
        Author: data.companyName,
        Creator: "Qeemly",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    if (data.offerMode === "internal") {
      renderInternalPdf(doc, data);
    } else {
      renderCandidatePdf(doc, data);
    }

    doc.end();
  });
}
