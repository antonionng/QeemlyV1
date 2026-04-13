/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useUploadStore } from "@/lib/upload/upload-state";

vi.mock("@/lib/upload/transformers", async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return {
    ...original,
    matchRole: (role: string) => {
      if (role === "Software Engineer") return "software-engineer";
      return null;
    },
  };
});

vi.stubGlobal("fetch", vi.fn());

import { StepRoleMapping } from "@/components/dashboard/upload/step-role-mapping";

describe("StepRoleMapping - full list", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.clearAllMocks();
    useUploadStore.getState().reset();

    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        roles: [
          { id: "software-engineer", label: "Software Engineer" },
          { id: "product-manager", label: "Product Manager" },
        ],
        levels: [],
      }),
    });
  });

  afterEach(() => {
    container.remove();
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
      .IS_REACT_ACT_ENVIRONMENT;
  });

  function seedStore() {
    const store = useUploadStore.getState();
    store.setDataType("employees");
    store.setFile({
      fileName: "test.csv",
      fileSize: 100,
      fileType: "csv",
      rowCount: 3,
      rows: [
        ["Software Engineer", "IC1"],
        ["HR Coordinator", "IC1"],
        ["Sales Director", "M1"],
      ],
      headers: ["Role", "Level"],
    });
    store.setMappings([
      { sourceColumn: "Role", sourceIndex: 0, targetField: "role", confidence: 1, sampleValues: [] },
      { sourceColumn: "Level", sourceIndex: 1, targetField: "level", confidence: 1, sampleValues: [] },
    ]);
    store.setRoleMapping("Sales Director", "product-manager");
  }

  function getRoleRowLabels(): string[] {
    const rows = container.querySelectorAll("[data-role-row]");
    return Array.from(rows).map((row) => {
      return row.querySelector("[data-role-label]")?.textContent ?? "";
    });
  }

  it("renders every uploaded role including auto-matched and manually mapped ones", async () => {
    seedStore();

    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(StepRoleMapping));
      await new Promise((r) => setTimeout(r, 50));
    });

    const labels = getRoleRowLabels();
    expect(labels).toContain("Software Engineer");
    expect(labels).toContain("HR Coordinator");
    expect(labels).toContain("Sales Director");
    expect(labels).toHaveLength(3);

    await act(async () => root.unmount());
  });

  it("preselects the mapped value in the dropdown for manually mapped roles", async () => {
    seedStore();

    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(StepRoleMapping));
      await new Promise((r) => setTimeout(r, 50));
    });

    const rows = container.querySelectorAll("[data-role-row]");
    const salesRow = Array.from(rows).find(
      (row) => row.querySelector("[data-role-label]")?.textContent === "Sales Director",
    );
    const select = salesRow?.querySelector("select");
    expect(select).toBeTruthy();
    expect(select?.value).toBe("product-manager");

    await act(async () => root.unmount());
  });
});
