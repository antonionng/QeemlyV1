/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUploadStore } from "@/lib/upload/upload-state";

vi.mock("@/lib/upload/transformers", async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return {
    ...original,
    matchRole: () => null,
    matchLevel: () => null,
  };
});

describe("upload wizard mapping persistence across steps", () => {
  beforeEach(() => {
    useUploadStore.getState().reset();
  });

  function seedStore() {
    const store = useUploadStore.getState();
    store.setDataType("employees");
    store.setFile({
      fileName: "test.csv",
      fileSize: 100,
      fileType: "csv",
      rowCount: 2,
      rows: [
        ["HR Coordinator", "Junior"],
        ["Sales Director", "Executive"],
      ],
      headers: ["Role", "Level"],
    });
    store.setMappings([
      { sourceColumn: "Role", sourceIndex: 0, targetField: "role", confidence: 1, sampleValues: [] },
      { sourceColumn: "Level", sourceIndex: 1, targetField: "level", confidence: 1, sampleValues: [] },
    ]);
  }

  it("keeps role mappings in the store after navigating forward then back", () => {
    seedStore();
    const store = useUploadStore.getState();

    store.goToStep("role-mapping");
    store.setRoleMapping("HR Coordinator", "hr-coordinator");
    store.addCustomRoleOption({ id: "hr-coordinator", label: "HR Coordinator" });

    store.goToStep("level-mapping");
    store.goToStep("role-mapping");

    const state = useUploadStore.getState();
    expect(state.roleMappings["HR Coordinator"]).toBe("hr-coordinator");
    expect(state.customRoleOptions).toEqual([
      { id: "hr-coordinator", label: "HR Coordinator" },
    ]);
  });

  it("keeps level mappings in the store after navigating forward then back", () => {
    seedStore();
    const store = useUploadStore.getState();

    store.goToStep("level-mapping");
    store.setLevelMapping("Junior", "ic1");
    store.addCustomLevelOption({
      id: "custom-exec",
      label: "Executive",
      description: "Custom level.",
    });
    store.setLevelMapping("Executive", "custom-exec");

    store.goToStep("validation");
    store.goToStep("level-mapping");

    const state = useUploadStore.getState();
    expect(state.levelMappings["Junior"]).toBe("ic1");
    expect(state.levelMappings["Executive"]).toBe("custom-exec");
    expect(state.customLevelOptions).toEqual([
      { id: "custom-exec", label: "Executive", description: "Custom level." },
    ]);
  });

  it("prevStep preserves all mapping data", () => {
    seedStore();
    const store = useUploadStore.getState();

    store.goToStep("role-mapping");
    store.setRoleMapping("Sales Director", "sales-director");
    store.addCustomRoleOption({ id: "sales-director", label: "Sales Director" });

    store.nextStep();
    expect(useUploadStore.getState().currentStep).toBe("level-mapping");

    store.prevStep();
    expect(useUploadStore.getState().currentStep).toBe("role-mapping");

    const state = useUploadStore.getState();
    expect(state.roleMappings["Sales Director"]).toBe("sales-director");
    expect(state.customRoleOptions).toContainEqual({
      id: "sales-director",
      label: "Sales Director",
    });
  });
});
