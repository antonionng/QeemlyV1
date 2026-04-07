import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

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

export async function renderOfferPdf(data: OfferPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 60, bottom: 60, left: 50, right: 50 },
      info: {
        Title: `Offer - ${data.recipientName} - ${data.roleTitle}`,
        Author: data.companyName,
        Creator: "Qeemly",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const brandColor = hexToRgb(data.primaryColor || "#5C45FD");
    const left = doc.page.margins.left;

    const qeemlyBrand: [number, number, number] = [92, 69, 253];

    // Header bar
    doc
      .rect(0, 0, doc.page.width, 8)
      .fill(brandColor);

    // Qeemly logo (top right)
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      const logoHeight = 24;
      const logoWidth = Math.round(logoHeight * (2791 / 1093));
      doc.image(logoPath, left + pageWidth - logoWidth, 28, {
        height: logoHeight,
      });
    }

    doc.moveDown(1);

    // Company name
    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor(brandColor)
      .text(data.companyName, left, 40);

    doc.moveDown(0.3);

    // Document title
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#666666")
      .text("COMPENSATION OFFER", left);

    doc.moveDown(1.5);

    // Divider line
    const divY = doc.y;
    doc
      .moveTo(left, divY)
      .lineTo(left + pageWidth, divY)
      .strokeColor("#E5E7EB")
      .lineWidth(1)
      .stroke();

    doc.moveDown(1);

    // Recipient section
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#9CA3AF")
      .text("PREPARED FOR", left);

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#111827")
      .text(data.recipientName, left);

    if (data.recipientEmail) {
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#6B7280")
        .text(data.recipientEmail, left);
    }

    doc.moveDown(1.2);

    // Position details
    const detailBoxY = doc.y;
    doc
      .roundedRect(left, detailBoxY, pageWidth, 80, 6)
      .fillColor("#F9FAFB")
      .fill();

    const col1X = left + 16;
    const col2X = left + pageWidth * 0.35;
    const col3X = left + pageWidth * 0.65;

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#9CA3AF")
      .text("ROLE", col1X, detailBoxY + 14);
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#111827")
      .text(data.roleTitle, col1X, detailBoxY + 28, { width: pageWidth * 0.3 });

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#9CA3AF")
      .text("LEVEL", col2X, detailBoxY + 14);
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#111827")
      .text(data.levelName, col2X, detailBoxY + 28);

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#9CA3AF")
      .text("LOCATION", col3X, detailBoxY + 14);
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#111827")
      .text(`${data.locationCity}, ${data.locationCountry}`, col3X, detailBoxY + 28, { width: pageWidth * 0.3 });

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#9CA3AF")
      .text("TYPE", col1X, detailBoxY + 50);
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#111827")
      .text(data.employmentType === "expat" ? "Expat" : "National", col1X, detailBoxY + 64);

    doc.y = detailBoxY + 100;

    // Compensation section
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#9CA3AF")
      .text("COMPENSATION PACKAGE", left);

    doc.moveDown(0.5);

    // Main offer value
    const offerBoxY = doc.y;
    doc
      .roundedRect(left, offerBoxY, pageWidth, 70, 6)
      .fillColor(brandColor)
      .fill();

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor([255, 255, 255])
      .text("TOTAL ANNUAL COMPENSATION", left + 20, offerBoxY + 14);

    doc
      .font("Helvetica-Bold")
      .fontSize(28)
      .fillColor([255, 255, 255])
      .text(currencyFormat(data.offerValue, data.currency), left + 20, offerBoxY + 30);

    doc.y = offerBoxY + 86;

    // Range and percentile
    const rangeY = doc.y;
    const halfWidth = (pageWidth - 12) / 2;

    doc
      .roundedRect(left, rangeY, halfWidth, 50, 4)
      .fillColor("#F9FAFB")
      .fill();

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#9CA3AF")
      .text("TARGET PERCENTILE", left + 12, rangeY + 10);
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#111827")
      .text(`P${data.targetPercentile}`, left + 12, rangeY + 26);

    doc
      .roundedRect(left + halfWidth + 12, rangeY, halfWidth, 50, 4)
      .fillColor("#F9FAFB")
      .fill();

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#9CA3AF")
      .text("NEGOTIATION RANGE", left + halfWidth + 24, rangeY + 10);
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#111827")
      .text(
        `${currencyFormat(data.offerLow, data.currency)} - ${currencyFormat(data.offerHigh, data.currency)}`,
        left + halfWidth + 24,
        rangeY + 26,
      );

    doc.y = rangeY + 66;

    // Salary breakdown
    const breakdownEntries = Object.entries(data.salaryBreakdown).filter(
      ([key, val]) => key !== "total_compensation" && val && typeof val === "object" && (val as { percent: number }).percent > 0,
    );

    if (breakdownEntries.length > 0) {
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#9CA3AF")
        .text("PACKAGE BREAKDOWN", left);

      doc.moveDown(0.4);

      for (const [key, val] of breakdownEntries) {
        const entry = val as { percent: number; amount: number };
        const label = key.charAt(0).toUpperCase() + key.slice(1);
        const rowY = doc.y;

        doc
          .font("Helvetica")
          .fontSize(10)
          .fillColor("#374151")
          .text(`${label} (${entry.percent}%)`, left, rowY);

        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor("#111827")
          .text(currencyFormat(entry.amount, data.currency), left + pageWidth - 120, rowY, {
            width: 120,
            align: "right",
          });

        doc.moveDown(0.3);

        // Progress bar
        const barY = doc.y;
        doc
          .roundedRect(left, barY, pageWidth, 4, 2)
          .fillColor("#F3F4F6")
          .fill();
        doc
          .roundedRect(left, barY, pageWidth * (entry.percent / 100), 4, 2)
          .fillColor(brandColor)
          .fill();

        doc.y = barY + 14;
      }
    }

    doc.moveDown(1);

    // Footer divider
    const footerDivY = doc.y;
    doc
      .moveTo(left, footerDivY)
      .lineTo(left + pageWidth, footerDivY)
      .strokeColor("#E5E7EB")
      .lineWidth(1)
      .stroke();

    doc.moveDown(0.6);

    // Benchmark metadata
    const generatedDate = new Date(data.createdAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#9CA3AF")
      .text(
        `Confidence: ${data.confidence}  |  Generated: ${generatedDate}`,
        left,
      );

    doc.moveDown(1.2);

    // Certification badge
    const certY = doc.y;
    doc
      .roundedRect(left, certY, pageWidth, 48, 4)
      .fillColor("#F9FAFB")
      .fill();

    // Qeemly logo in badge
    const badgeLogoX = left + 16;
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, badgeLogoX, certY + 12, { height: 16 });
    }

    const textX = badgeLogoX + 60;
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#374151")
      .text("Salary Benchmarked & Certified", textX, certY + 11);

    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor("#9CA3AF")
      .text(
        "qeemly.com  |  The GCC compensation intelligence standard",
        textX,
        certY + 26,
      );

    // Bottom brand bar
    doc
      .rect(0, doc.page.height - 8, doc.page.width, 8)
      .fill(brandColor);

    doc.end();
  });
}
