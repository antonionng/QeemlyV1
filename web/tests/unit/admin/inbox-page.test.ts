/** @vitest-environment jsdom */

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminInboxPage from "@/app/admin/(dashboard)/inbox/page";

describe("AdminInboxPage", () => {
  let uploads: Array<Record<string, unknown>>;
  let reviewRows: Array<Record<string, unknown>>;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    uploads = [];
    reviewRows = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url === "/api/admin/inbox" && (!init || !init.method || init.method === "GET")) {
          return new Response(JSON.stringify(uploads), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (url === "/api/admin/inbox" && init?.method === "POST") {
          const upload = {
            id: "upload-1",
            file_name: "market-guide.csv",
            file_path: "uploads/2026-03-12/market-guide.csv",
            file_kind: "csv",
            ingest_queue: "Structured import",
            ingestion_status: "uploaded",
            ingestion_notes: null,
            uploaded_by: "admin-1",
            mime_type: "text/csv",
            file_size: 17,
            created_at: "2026-03-12T22:00:00.000Z",
            updated_at: "2026-03-12T22:00:00.000Z",
          };
          uploads.splice(0, uploads.length, upload);
          return new Response(
            JSON.stringify(upload),
            {
              status: 201,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        if (url === "/api/admin/inbox/upload-1/extract" && init?.method === "POST") {
          uploads.splice(0, uploads.length, {
            id: "upload-1",
            file_name: "Robert Walters Tech Guide.pdf",
            file_path: "uploads/2026-03-24/robert-walters-tech.pdf",
            file_kind: "pdf",
            ingest_queue: "Document review",
            ingestion_status: "reviewing",
            ingestion_notes: "Extracted 1 Robert Walters pilot rows.",
            uploaded_by: "admin-1",
            mime_type: "application/pdf",
            file_size: 128,
            created_at: "2026-03-24T12:00:00.000Z",
            updated_at: "2026-03-24T12:00:00.000Z",
          });
          reviewRows.splice(0, reviewRows.length, {
            id: "row-1",
            upload_id: "upload-1",
            row_index: 1,
            source_family: "robert_walters",
            raw_text: "raw row",
            role_title: "Senior Software Engineer",
            function_name: "Technology",
            employment_type: "Permanent",
            pay_period: "monthly",
            currency: "AED",
            location_hint: "Dubai",
            level_hint: "Senior Software Engineer",
            salary_2025_min: 30000,
            salary_2025_max: 40000,
            salary_2026_min: 35000,
            salary_2026_max: 45000,
            parse_confidence: "high",
            review_status: "pending",
            review_notes: null,
          });
          return new Response(JSON.stringify({ ok: true, extractedCount: 1 }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (url === "/api/admin/inbox/upload-1/rows" && init?.method === "PATCH") {
          const body = JSON.parse(String(init.body ?? "{}")) as {
            rowId: string;
            changes: Record<string, unknown>;
          };
          const row = reviewRows.find((entry) => entry.id === body.rowId);
          if (row) {
            Object.assign(row, body.changes);
          }
          return new Response(JSON.stringify(row), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (url === "/api/admin/inbox/upload-1/rows" && (!init || init.method === "GET")) {
          return new Response(JSON.stringify(reviewRows), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (url === "/api/admin/inbox/upload-1/ingest" && init?.method === "POST") {
          const row = reviewRows[0];
          if (row) {
            row.review_status = "ingested";
          }
          const upload = uploads[0];
          if (upload) {
            upload.ingestion_status = "ingested";
            upload.ingestion_notes = "Ingested 1 approved Robert Walters rows.";
          }
          return new Response(JSON.stringify({ ok: true, ingestedCount: 1, failedCount: 0 }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        throw new Error(`Unexpected fetch call: ${url}`);
      }),
    );
  });

  afterEach(() => {
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("shows upload history and ingestion status after confirming an inbox upload", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(AdminInboxPage));
    });

    expect(container.textContent).toContain("No uploaded research assets yet");

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(fileInput).not.toBeNull();

    const file = new File(["name,amount\nA,100"], "market-guide.csv", {
      type: "text/csv",
    });

    await act(async () => {
      Object.defineProperty(fileInput, "files", {
        configurable: true,
        value: [file],
      });
      fileInput?.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(container.textContent).toContain("Ready to Upload");
    expect(container.textContent).toContain("Upload to Inbox");
    expect(container.textContent).not.toContain("market-guide.csvStructured data");

    const uploadButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Upload to Inbox"),
    );
    expect(uploadButton).toBeDefined();

    await act(async () => {
      uploadButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Upload History");
    expect(container.textContent).toContain("market-guide.csv");
    expect(container.textContent).toContain("Structured import");
    expect(container.textContent).toContain("uploaded");

    await act(async () => {
      root.unmount();
    });
  });

  it("supports extracting, approving, and ingesting Robert Walters PDF rows", async () => {
    uploads.push({
      id: "upload-1",
      file_name: "Robert Walters Tech Guide.pdf",
      file_path: "uploads/2026-03-24/robert-walters-tech.pdf",
      file_kind: "pdf",
      ingest_queue: "Document review",
      ingestion_status: "uploaded",
      ingestion_notes: null,
      uploaded_by: "admin-1",
      mime_type: "application/pdf",
      file_size: 128,
      created_at: "2026-03-24T12:00:00.000Z",
      updated_at: "2026-03-24T12:00:00.000Z",
    });

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(AdminInboxPage));
    });

    expect(container.textContent).toContain("Robert Walters Tech Guide.pdf");
    const extractButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Extract Pilot Rows"),
    );
    expect(extractButton).toBeDefined();

    await act(async () => {
      extractButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Pilot PDF Review");
    expect(container.textContent).toContain("Senior Software Engineer");
    expect(container.textContent).toContain("AED 35,000 - 45,000");

    const approveButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Approve"),
    );
    expect(approveButton).toBeDefined();

    await act(async () => {
      approveButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("approved");
    expect(container.textContent).toContain("Ingest Approved Rows");

    const ingestButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Ingest Approved Rows"),
    );
    expect(ingestButton).toBeDefined();

    await act(async () => {
      ingestButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("1 approved PDF row moved into market staging.");
    expect(container.textContent).toContain("ingested");

    await act(async () => {
      root.unmount();
    });
  });
});
