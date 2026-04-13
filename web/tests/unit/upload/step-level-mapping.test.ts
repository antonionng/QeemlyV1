/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useUploadStore } from "@/lib/upload/upload-state";

vi.mock("@/lib/upload/transformers", async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return {
    ...original,
    matchLevel: (level: string) => {
      if (level === "Senior") return "ic3";
      return null;
    },
    matchRole: () => null,
  };
});

vi.mock("@/lib/company", () => ({
  useCompanySettings: () => true,
}));

vi.stubGlobal("fetch", vi.fn());

import { StepLevelMapping } from "@/components/dashboard/upload/step-level-mapping";

describe("StepLevelMapping - full list", () => {
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
        roles: [],
        levels: [
          { id: "ic1", label: "IC1", description: "Entry level." },
          { id: "ic3", label: "IC3", description: "Senior." },
          { id: "m1", label: "M1", description: "Manager." },
        ],
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
        ["Engineer", "Senior"],
        ["Coordinator", "Junior"],
        ["Director", "Executive"],
      ],
      headers: ["Role", "Level"],
    });
    store.setMappings([
      { sourceColumn: "Role", sourceIndex: 0, targetField: "role", confidence: 1, sampleValues: [] },
      { sourceColumn: "Level", sourceIndex: 1, targetField: "level", confidence: 1, sampleValues: [] },
    ]);
    store.setLevelMapping("Executive", "m1");
  }

  function getLevelRowLabels(): string[] {
    const rows = container.querySelectorAll("[data-level-row]");
    return Array.from(rows).map((row) => {
      return row.querySelector("[data-level-label]")?.textContent ?? "";
    });
  }

  it("renders every uploaded level including auto-matched and manually mapped ones", async () => {
    seedStore();

    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(StepLevelMapping));
      await new Promise((r) => setTimeout(r, 50));
    });

    const labels = getLevelRowLabels();
    expect(labels).toContain("Senior");
    expect(labels).toContain("Junior");
    expect(labels).toContain("Executive");
    expect(labels).toHaveLength(3);

    await act(async () => root.unmount());
  });

  it("preselects the mapped value in the dropdown for manually mapped levels", async () => {
    seedStore();

    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(StepLevelMapping));
      await new Promise((r) => setTimeout(r, 50));
    });

    const rows = container.querySelectorAll("[data-level-row]");
    const execRow = Array.from(rows).find(
      (row) => row.querySelector("[data-level-label]")?.textContent === "Executive",
    );
    const select = execRow?.querySelector("select");
    expect(select).toBeTruthy();
    expect(select?.value).toBe("m1");

    await act(async () => root.unmount());
  });
});
