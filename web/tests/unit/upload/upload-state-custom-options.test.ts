import { beforeEach, describe, expect, it } from "vitest";
import { useUploadStore } from "@/lib/upload/upload-state";

describe("upload store custom mapping options", () => {
  beforeEach(() => {
    useUploadStore.getState().reset();
  });

  it("stores custom role options and exposes them via getState", () => {
    const store = useUploadStore.getState();
    store.addCustomRoleOption({ id: "custom-sales-rep", label: "Sales Rep" });

    const { customRoleOptions } = useUploadStore.getState();
    expect(customRoleOptions).toEqual([
      { id: "custom-sales-rep", label: "Sales Rep" },
    ]);
  });

  it("stores custom level options and exposes them via getState", () => {
    const store = useUploadStore.getState();
    store.addCustomLevelOption({
      id: "custom-l5",
      label: "L5",
      description: "Custom level created during import mapping.",
    });

    const { customLevelOptions } = useUploadStore.getState();
    expect(customLevelOptions).toEqual([
      {
        id: "custom-l5",
        label: "L5",
        description: "Custom level created during import mapping.",
      },
    ]);
  });

  it("deduplicates options by id", () => {
    const store = useUploadStore.getState();
    store.addCustomRoleOption({ id: "dup-role", label: "First" });
    store.addCustomRoleOption({ id: "dup-role", label: "Second" });

    expect(useUploadStore.getState().customRoleOptions).toHaveLength(1);
  });

  it("preserves custom options across step changes", () => {
    const store = useUploadStore.getState();
    store.addCustomRoleOption({ id: "persist-role", label: "Persistent" });

    store.goToStep("level-mapping");
    store.goToStep("role-mapping");

    expect(useUploadStore.getState().customRoleOptions).toEqual([
      { id: "persist-role", label: "Persistent" },
    ]);
  });

  it("clears custom options on reset", () => {
    const store = useUploadStore.getState();
    store.addCustomRoleOption({ id: "temp-role", label: "Temp" });
    store.addCustomLevelOption({
      id: "temp-level",
      label: "Temp",
      description: "Temp",
    });

    store.reset();

    const state = useUploadStore.getState();
    expect(state.customRoleOptions).toEqual([]);
    expect(state.customLevelOptions).toEqual([]);
  });
});
