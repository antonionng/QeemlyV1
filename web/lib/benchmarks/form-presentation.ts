type MinimalBenchmarkForm = {
  roleId: string | null;
  levelId: string | null;
  locationId: string | null;
};

type PersistableBenchmarkState = {
  savedFilters: unknown[];
  recentResults: unknown[];
};

type BenchmarkStateLike = PersistableBenchmarkState & {
  formData?: MinimalBenchmarkForm;
  isFormComplete?: boolean;
};

export type RoleSelectionState = "empty" | "searching" | "selected";

export function getRoleSelectionState(input: {
  roleId: string | null;
  roleSearch: string;
}): RoleSelectionState {
  if (input.roleSearch.trim().length > 0) {
    return "searching";
  }

  if (input.roleId) {
    return "selected";
  }

  return "empty";
}

export function getBenchmarkFormCompletionMessage(form: MinimalBenchmarkForm): string {
  if (!form.roleId) {
    return "Select a role from the list to continue.";
  }

  if (!form.levelId) {
    return "Choose a level to price this role.";
  }

  if (!form.locationId) {
    return "Choose a location to price this role.";
  }

  return "Ready to price this role.";
}

export function getBenchmarkCohortValueLabel(value: string | null | undefined): string {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return "not set";
  }

  return normalizedValue;
}

export function getBenchmarkWorkspaceDefaultLabel(value: string | null | undefined): string {
  return `Workspace default (${getBenchmarkCohortValueLabel(value)})`;
}

export function getPersistedBenchmarkStateSlice(
  state: BenchmarkStateLike,
): PersistableBenchmarkState {
  return {
    savedFilters: state.savedFilters,
    recentResults: state.recentResults,
  };
}

export function migratePersistedBenchmarkState(
  persisted: Partial<BenchmarkStateLike> | undefined,
): PersistableBenchmarkState {
  return {
    savedFilters: Array.isArray(persisted?.savedFilters) ? persisted.savedFilters : [],
    recentResults: Array.isArray(persisted?.recentResults) ? persisted.recentResults : [],
  };
}
