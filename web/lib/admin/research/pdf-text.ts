import path from "node:path";
import { pathToFileURL } from "node:url";

function resolveBundledPdfWorkerUrl() {
  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "pdf-parse",
    "dist",
    "pdf-parse",
    "web",
    "pdf.worker.mjs",
  );

  return pathToFileURL(workerPath).href;
}

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const pdfParseModule = await import("pdf-parse");
  pdfParseModule.PDFParse.setWorker(resolveBundledPdfWorkerUrl());
  const parser = new pdfParseModule.PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text ?? "";
  } finally {
    await parser.destroy();
  }
}
