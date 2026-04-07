/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ComplianceSettingsPanel } from "@/components/dashboard/settings/compliance-settings-panel";

function createJsonResponse(payload: unknown) {
  return {
    ok: true,
    json: async () => payload,
  } satisfies Partial<Response>;
}

function createErrorResponse(payload: unknown) {
  return {
    ok: false,
    json: async () => payload,
  } satisfies Partial<Response>;
}

describe("ComplianceSettingsPanel workspace refresh", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === "/api/settings/compliance") {
          return createJsonResponse({
            settings: {
              default_jurisdictions: ["UAE"],
              prefer_integration_data: false,
              prefer_import_data: false,
              allow_manual_overrides: true,
              visa_lead_time_days: 30,
              deadline_sla_days: 14,
              document_renewal_threshold_days: 30,
              risk_weights: {},
              is_compliance_configured: true,
            },
            ingestion: {
              integration_sync_count: 0,
              last_integration_success_at: null,
            },
          });
        }

        if (url.startsWith("/api/settings/compliance/")) {
          return createJsonResponse({ items: [] });
        }

        throw new Error(`Unexpected fetch: ${url}`);
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    container.remove();
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
      .IS_REACT_ACT_ENVIRONMENT;
  });

  it("reloads settings and domain records when the workspace changes", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(ComplianceSettingsPanel));
      await Promise.resolve();
    });

    const fetchMock = vi.mocked(globalThis.fetch);
    expect(fetchMock).toHaveBeenCalledTimes(7);

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent("qeemly:workspace-changed", {
          detail: { workspaceId: "workspace-2", source: "override" },
        }),
      );
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(14);

    await act(async () => {
      root.unmount();
    });
  });

  it("shows field-level save errors returned by the API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (url === "/api/settings/compliance" && method === "GET") {
          return createJsonResponse({
            settings: {
              default_jurisdictions: ["UAE"],
              prefer_integration_data: false,
              prefer_import_data: false,
              allow_manual_overrides: true,
              visa_lead_time_days: 30,
              deadline_sla_days: 14,
              document_renewal_threshold_days: 30,
              risk_weights: {},
              is_compliance_configured: true,
            },
            ingestion: {
              integration_sync_count: 0,
              last_integration_success_at: null,
            },
          });
        }

        if (url.startsWith("/api/settings/compliance/") && method === "GET") {
          return createJsonResponse({ items: [] });
        }

        if (url === "/api/settings/compliance" && method === "PATCH") {
          return createErrorResponse({
            error: "Please correct the highlighted fields and try again.",
            message: "Please correct the highlighted fields and try again.",
            code: "validation_error",
            fields: {
              visa_lead_time_days: "Visa lead time days must be a non-negative number",
            },
          });
        }

        throw new Error(`Unexpected fetch: ${method} ${url}`);
      }),
    );

    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(ComplianceSettingsPanel));
      await Promise.resolve();
    });

    const saveButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Save Compliance Rules"),
    );

    expect(saveButton).toBeTruthy();

    await act(async () => {
      saveButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Please correct the highlighted fields and try again.");
    expect(container.textContent).toContain("Visa lead time days must be a non-negative number");

    await act(async () => {
      root.unmount();
    });
  });
});
