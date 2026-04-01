/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  usePathnameMock,
  createClientMock,
  companySettingsState,
  isFeatureEnabledMock,
} = vi.hoisted(() => ({
  usePathnameMock: vi.fn(),
  createClientMock: vi.fn(),
  companySettingsState: {
    companyName: "Qeemly",
    companyLogo: null,
    updateSettings: vi.fn(),
    markAsConfigured: vi.fn(),
  },
  isFeatureEnabledMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a"> & { href: string }) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("@/components/logo", () => ({
  Logo: () => React.createElement("div", { "data-testid": "sidebar-logo" }, "Qeemly"),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/company", () => ({
  useCompanySettings: () => companySettingsState,
}));

vi.mock("@/lib/release/ga-scope", () => ({
  isFeatureEnabled: isFeatureEnabledMock,
}));

vi.mock("@/components/dashboard/workspace-switcher", () => ({
  WorkspaceSwitcher: () => React.createElement("div", { "data-testid": "workspace-switcher" }, "WorkspaceSwitcher"),
}));

import { DashboardSidebar } from "@/components/dashboard/sidebar";

function createJsonResponse(payload: unknown) {
  return {
    ok: true,
    json: async () => payload,
  } satisfies Partial<Response>;
}

describe("DashboardSidebar workspace refresh", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);

    usePathnameMock.mockReturnValue("/dashboard/overview");
    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-1",
              email: "admin@example.com",
            },
          },
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                full_name: "Admin User",
                avatar_url: null,
                role: "admin",
              },
            }),
          })),
        })),
      })),
    });
    isFeatureEnabledMock.mockReturnValue(true);
    companySettingsState.updateSettings.mockReset();
    companySettingsState.markAsConfigured.mockReset();

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === "/api/settings") {
          return createJsonResponse({
            workspace_name: "Workspace One",
            settings: {
              company_name: "Workspace One",
              company_logo: "",
              company_website: "",
              company_description: "",
              primary_color: "#5C45FD",
              industry: "Technology",
              company_size: "201-500",
              funding_stage: "seed",
              headquarters_country: "AE",
              headquarters_city: "Dubai",
              target_percentile: 50,
              review_cycle: "annual",
              default_currency: "AED",
              fiscal_year_start: 1,
              default_bonus_percentage: 15,
              equity_vesting_schedule: "4-year-1-cliff",
              benefits_tier: "standard",
              is_configured: true,
            },
          });
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

  it("re-fetches workspace settings when the workspace changes", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(DashboardSidebar));
      await Promise.resolve();
    });

    const fetchMock = vi.mocked(globalThis.fetch);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent("qeemly:workspace-changed", {
          detail: { workspaceId: "ws-2", source: "override" },
        }),
      );
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);

    await act(async () => {
      root.unmount();
    });
  });
});
