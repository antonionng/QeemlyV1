/** @vitest-environment jsdom */

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminInboxPage from "@/app/admin/(dashboard)/inbox/page";

describe("AdminInboxPage", () => {
  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const uploads: Array<Record<string, unknown>> = [];
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
});
