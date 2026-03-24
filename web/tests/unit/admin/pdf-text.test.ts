import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  setWorkerMock,
  getTextMock,
  destroyMock,
  PDFParseMock,
} = vi.hoisted(() => {
  const setWorkerMock = vi.fn();
  const getTextMock = vi.fn().mockResolvedValue({ text: "parsed text" });
  const destroyMock = vi.fn().mockResolvedValue(undefined);
  class PDFParseMock {
    static setWorker = setWorkerMock;

    getText = getTextMock;
    destroy = destroyMock;

    constructor(_options: unknown) {}
  }
  PDFParseMock.setWorker = setWorkerMock;

  return {
    setWorkerMock,
    getTextMock,
    destroyMock,
    PDFParseMock,
  };
});

vi.mock("pdf-parse", () => ({
  PDFParse: PDFParseMock,
}));

describe("extractTextFromPdfBuffer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTextMock.mockResolvedValue({ text: "parsed text" });
    destroyMock.mockResolvedValue(undefined);
  });

  it("configures the bundled pdf worker before parsing", async () => {
    const { extractTextFromPdfBuffer } = await import("@/lib/admin/research/pdf-text");

    const text = await extractTextFromPdfBuffer(Buffer.from("pdf"));

    expect(text).toBe("parsed text");
    expect(setWorkerMock).toHaveBeenCalledTimes(1);
    expect(String(setWorkerMock.mock.calls[0][0])).toContain("pdf.worker.mjs");
    expect(getTextMock).toHaveBeenCalledTimes(1);
    expect(destroyMock).toHaveBeenCalledTimes(1);
  });
});
