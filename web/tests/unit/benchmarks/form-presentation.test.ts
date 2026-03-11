import { describe, expect, it } from "vitest";
import {
  getBenchmarkFormCompletionMessage,
  getBenchmarkWorkspaceDefaultLabel,
  migratePersistedBenchmarkState,
  getPersistedBenchmarkStateSlice,
  getRoleSelectionState,
} from "@/lib/benchmarks/form-presentation";

describe("benchmark form presentation", () => {
  it("starts with a true empty role state until a role is committed", () => {
    expect(getRoleSelectionState({ roleId: null, roleSearch: "" })).toBe("empty");
    expect(getRoleSelectionState({ roleId: null, roleSearch: "DevOps" })).toBe("searching");
    expect(getRoleSelectionState({ roleId: "role-1", roleSearch: "" })).toBe("selected");
  });

  it("explains why the pricing CTA is disabled", () => {
    expect(
      getBenchmarkFormCompletionMessage({
        roleId: null,
        levelId: null,
        locationId: null,
      }),
    ).toBe("Select a role from the list to continue.");

    expect(
      getBenchmarkFormCompletionMessage({
        roleId: "role-1",
        levelId: null,
        locationId: "london",
      }),
    ).toBe("Choose a level to price this role.");

    expect(
      getBenchmarkFormCompletionMessage({
        roleId: "role-1",
        levelId: "level-1",
        locationId: "london",
      }),
    ).toBe("Ready to price this role.");
  });

  it("formats workspace cohort labels without empty parentheses", () => {
    expect(getBenchmarkWorkspaceDefaultLabel("Fintech")).toBe("Workspace default (Fintech)");
    expect(getBenchmarkWorkspaceDefaultLabel("  201-500  ")).toBe("Workspace default (201-500)");
    expect(getBenchmarkWorkspaceDefaultLabel("")).toBe("Workspace default (not set)");
    expect(getBenchmarkWorkspaceDefaultLabel("   ")).toBe("Workspace default (not set)");
    expect(getBenchmarkWorkspaceDefaultLabel(null)).toBe("Workspace default (not set)");
  });

  it("does not persist transient form inputs between visits", () => {
    expect(
      getPersistedBenchmarkStateSlice({
        formData: {
          roleId: "role-1",
          levelId: "level-1",
          locationId: "london",
        },
        isFormComplete: true,
        savedFilters: [{ id: "saved-1" }],
        recentResults: [{ id: "recent-1" }],
      }),
    ).toEqual({
      savedFilters: [{ id: "saved-1" }],
      recentResults: [{ id: "recent-1" }],
    });
  });

  it("drops stale persisted form values from older benchmark sessions", () => {
    expect(
      migratePersistedBenchmarkState({
        formData: {
          roleId: "role-1",
          levelId: "level-1",
          locationId: "london",
        },
        isFormComplete: true,
        savedFilters: [{ id: "saved-1" }],
        recentResults: [{ id: "recent-1" }],
      }),
    ).toEqual({
      savedFilters: [{ id: "saved-1" }],
      recentResults: [{ id: "recent-1" }],
    });
  });
});
