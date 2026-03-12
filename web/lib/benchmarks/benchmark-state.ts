// Benchmark State - Form-first flow state management

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type Role,
  type Level,
  type Location,
  type SalaryBenchmark,
  ROLES,
  LEVELS,
  LOCATIONS,
} from "../dashboard/dummy-data";
import { useCompanySettings, type TargetPercentile } from "../company/settings";
import { getBenchmark } from "./data-service";
import {
  getDefaultBenchmarkDetailTab,
  type BenchmarkDetailTabId,
} from "./detail-tabs";
import {
  getPersistedBenchmarkStateSlice,
  migratePersistedBenchmarkState,
} from "./form-presentation";

// Types
export type BenchmarkContext = "existing" | "new-hire" | "relocating";

export interface BenchmarkFormData {
  // Context
  context: BenchmarkContext;
  
  // Role details
  roleId: string | null;
  levelId: string | null;
  locationId: string | null;
  employmentType: "national" | "expat";
  
  // Current salary (for existing/relocating)
  currentSalaryLow: number | null;
  currentSalaryHigh: number | null;
  
  // Market filters (overrides company defaults)
  industry: string | null;
  companySize: string | null;
  fundingStage: string | null;
  
  // Target percentile override
  targetPercentile: TargetPercentile | null;
}

export interface BenchmarkResult {
  formData: BenchmarkFormData;
  benchmark: SalaryBenchmark;
  role: Role;
  level: Level;
  location: Location;
  isOverridden: boolean; // True if any setting was overridden from company defaults
  createdAt: Date;
}

// Saved filter for quick re-runs
export interface SavedFilter {
  id: string;
  name: string; // Auto-generated or user-provided
  formData: BenchmarkFormData;
  createdAt: Date;
}

// Generate a unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Generate filter name from form data
function generateFilterName(formData: BenchmarkFormData): string {
  const role = ROLES.find(r => r.id === formData.roleId);
  const level = LEVELS.find(l => l.id === formData.levelId);
  const location = BENCHMARK_LOCATIONS.find(l => l.id === formData.locationId);

  const parts = [];
  if (role) parts.push(role.title);
  if (location) parts.push(location.city);
  if (level) parts.push(level.name);

  return parts.join(", ") || "Unnamed Filter";
}

export interface BenchmarkState {
  workspaceId: string | null;
  // Form state
  formData: BenchmarkFormData;
  isFormComplete: boolean;
  
  // Results state
  currentResult: BenchmarkResult | null;
  recentResults: BenchmarkResult[];
  
  // Saved filters
  savedFilters: SavedFilter[];
  
  // UI state
  step: "form" | "results" | "detail";
  detailTab: BenchmarkDetailTabId;
  
  // Form actions
  reconcileWorkspace: (workspaceId: string | null) => void;
  updateFormField: <K extends keyof BenchmarkFormData>(field: K, value: BenchmarkFormData[K]) => void;
  resetForm: () => void;
  runBenchmark: () => Promise<void>;
  goToStep: (step: "form" | "results" | "detail") => void;
  openDetailTab: (tab: BenchmarkDetailTabId) => void;
  setDetailTab: (tab: BenchmarkDetailTabId) => void;
  clearResult: () => void;
  
  // Saved filter actions
  saveCurrentFilter: (name?: string) => void;
  loadFilter: (id: string) => void;
  deleteFilter: (id: string) => void;
  renameFilter: (id: string, name: string) => void;
  
  // Bulk update and run
  updateAndRun: (updates: Partial<BenchmarkFormData>) => void;
}

const DEFAULT_FORM_DATA: BenchmarkFormData = {
  context: "existing",
  roleId: null,
  levelId: null,
  locationId: null,
  employmentType: "national",
  currentSalaryLow: null,
  currentSalaryHigh: null,
  industry: null,
  companySize: null,
  fundingStage: null,
  targetPercentile: null,
};

// Check if form is complete
function isFormComplete(form: BenchmarkFormData): boolean {
  return !!(
    form.roleId &&
    form.levelId &&
    form.locationId
  );
}

export const useBenchmarkState = create<BenchmarkState>()(
  persist(
    (set, get) => ({
      workspaceId: null,
      formData: { ...DEFAULT_FORM_DATA },
      isFormComplete: false,
      currentResult: null,
      recentResults: [],
      savedFilters: [],
      step: "form",
      detailTab: getDefaultBenchmarkDetailTab(),

      reconcileWorkspace: (workspaceId) => {
        if (!workspaceId) return;

        set((state) => {
          if (state.workspaceId === workspaceId) {
            return state;
          }

          return {
            workspaceId,
            formData: { ...DEFAULT_FORM_DATA },
            isFormComplete: false,
            currentResult: null,
            recentResults: [],
            savedFilters: [],
            step: "form",
            detailTab: getDefaultBenchmarkDetailTab(),
          };
        });
      },
      
      updateFormField: (field, value) => {
        set((state) => {
          const newFormData = { ...state.formData, [field]: value };
          return {
            formData: newFormData,
            isFormComplete: isFormComplete(newFormData),
          };
        });
      },
      
      resetForm: () => {
        set({
          formData: { ...DEFAULT_FORM_DATA },
          isFormComplete: false,
          currentResult: null,
          step: "form",
          detailTab: getDefaultBenchmarkDetailTab(),
        });
      },
      
      runBenchmark: async () => {
        const { formData } = get();
        const companySettings = useCompanySettings.getState();
        
        if (!formData.roleId || !formData.levelId || !formData.locationId) {
          return;
        }

        const resolvedFormData: BenchmarkFormData = {
          ...formData,
          industry: formData.industry || companySettings.industry || null,
          companySize: formData.companySize || companySettings.companySize || null,
        };
        
        const role = ROLES.find(r => r.id === resolvedFormData.roleId)!;
        const level = LEVELS.find(l => l.id === resolvedFormData.levelId)!;
        const location = BENCHMARK_LOCATIONS.find(l => l.id === resolvedFormData.locationId);
        if (!location) {
          return;
        }
        
        const benchmark = await getBenchmark(
          resolvedFormData.roleId!,
          resolvedFormData.locationId!,
          resolvedFormData.levelId!,
          {
            industry: resolvedFormData.industry,
            companySize: resolvedFormData.companySize,
          },
        );
        if (!benchmark) {
          return;
        }
        
        // Check if any settings were overridden
        const isOverridden = !!(
          formData.targetPercentile ||
          formData.industry ||
          formData.companySize
        );
        
        const result: BenchmarkResult = {
          formData: resolvedFormData,
          benchmark,
          role,
          level,
          location,
          isOverridden,
          createdAt: new Date(),
        };
        
        set((state) => ({
          currentResult: result,
          recentResults: [result, ...state.recentResults.slice(0, 9)],
          step: "results",
          detailTab: getDefaultBenchmarkDetailTab(),
        }));
      },
      
      goToStep: (step) => {
        set({ step });
      },

      openDetailTab: (tab) => {
        set({
          detailTab: tab,
          step: "detail",
        });
      },

      setDetailTab: (tab) => {
        set({ detailTab: tab });
      },
      
      clearResult: () => {
        set({
          currentResult: null,
          step: "form",
          detailTab: getDefaultBenchmarkDetailTab(),
        });
      },
      
      saveCurrentFilter: (name) => {
        const { formData } = get();
        
        // Only save if form has meaningful data
        if (!formData.roleId || !formData.levelId || !formData.locationId) {
          return;
        }
        
        const filter: SavedFilter = {
          id: generateId(),
          name: name || generateFilterName(formData),
          formData: { ...formData },
          createdAt: new Date(),
        };
        
        set((state) => ({
          savedFilters: [filter, ...state.savedFilters.slice(0, 9)], // Max 10 saved filters
        }));
      },
      
      loadFilter: (id) => {
        const { savedFilters } = get();
        const filter = savedFilters.find(f => f.id === id);
        
        if (filter) {
          set({
            formData: { ...filter.formData },
            isFormComplete: isFormComplete(filter.formData),
            step: "form",
            detailTab: getDefaultBenchmarkDetailTab(),
          });
        }
      },
      
      deleteFilter: (id) => {
        set((state) => ({
          savedFilters: state.savedFilters.filter(f => f.id !== id),
        }));
      },
      
      renameFilter: (id, name) => {
        set((state) => ({
          savedFilters: state.savedFilters.map(f =>
            f.id === id ? { ...f, name } : f
          ),
        }));
      },
      
      updateAndRun: (updates) => {
        const { formData, runBenchmark } = get();
        const newFormData = { ...formData, ...updates };
        
        set({
          formData: newFormData,
          isFormComplete: isFormComplete(newFormData),
        });
        
        // Run benchmark with updated form data
        // Need to call runBenchmark after state is updated
        setTimeout(() => {
          void runBenchmark();
        }, 0);
      },
    }),
    {
      name: "qeemly:benchmark-state",
      version: 2,
      migrate: (persistedState) => migratePersistedBenchmarkState(
        persistedState as Partial<BenchmarkState>,
      ),
      partialize: (state) => getPersistedBenchmarkStateSlice(state),
    }
  )
);

export const BENCHMARK_LOCATIONS: Location[] = LOCATIONS;

export function getBenchmarkLocation(id: string): Location | undefined {
  return BENCHMARK_LOCATIONS.find((location) => location.id === id);
}
