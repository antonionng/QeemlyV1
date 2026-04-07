import { LOCATIONS } from "@/lib/dashboard/dummy-data";

type MinimalBenchmarkForm = {
  roleId: string | null;
  levelId: string | null;
  locationId: string | null;
};

type PersistableBenchmarkState = {
  workspaceId: string | null;
  savedFilters: unknown[];
  recentResults: unknown[];
};

type BenchmarkStateLike = PersistableBenchmarkState & {
  formData?: MinimalBenchmarkForm;
  isFormComplete?: boolean;
};

export type RoleSelectionState = "empty" | "searching" | "selected";

const SUPPORTED_BENCHMARK_LOCATION_IDS = new Set(
  LOCATIONS.filter((location) => location.countryCode !== "GB").map((location) => location.id),
);

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
    workspaceId:
      typeof (state as { workspaceId?: unknown }).workspaceId === "string"
        ? ((state as { workspaceId?: string | null }).workspaceId ?? null)
        : null,
    savedFilters: state.savedFilters,
    recentResults: state.recentResults,
  };
}

export function migratePersistedBenchmarkState(
  persisted: Partial<BenchmarkStateLike> | undefined,
): PersistableBenchmarkState {
  const savedFilters = Array.isArray(persisted?.savedFilters) ? persisted.savedFilters : [];
  const recentResults = Array.isArray(persisted?.recentResults) ? persisted.recentResults : [];

  return {
    workspaceId: typeof (persisted as { workspaceId?: unknown })?.workspaceId === "string"
      ? (((persisted as { workspaceId?: string | null }).workspaceId) ?? null)
      : null,
    savedFilters: savedFilters.filter(hasSupportedPersistedBenchmarkLocation),
    recentResults: recentResults.filter(hasSupportedPersistedBenchmarkLocation),
  };
}

function hasSupportedPersistedBenchmarkLocation(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;

  const formData = (value as { formData?: { locationId?: unknown } }).formData;
  if (!formData || typeof formData !== "object") return true;

  const locationId = formData.locationId;
  return typeof locationId !== "string" || SUPPORTED_BENCHMARK_LOCATION_IDS.has(locationId);
}
