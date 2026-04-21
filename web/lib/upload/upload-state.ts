// Zustand store for upload wizard state

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ParsedFile } from "./parser";
import type { ColumnMapping, UploadDataType } from "./column-detection";
import type { ValidationResult, RowValidationResult } from "./validators";

export type WizardStep = 
  | "data-type"
  | "file-upload"
  | "column-mapping"
  | "department-mapping"
  | "role-mapping"
  | "level-mapping"
  | "validation"
  | "auto-fix"
  | "error-review"
  | "confirm"
  | "success";

export type UploadImportMode = "upsert" | "replace";

export type CustomRoleOption = {
  id: string;
  label: string;
};

export type CustomLevelOption = {
  id: string;
  label: string;
  description?: string;
};

export type UploadState = {
  // Wizard navigation
  currentStep: WizardStep;
  mode: "page" | "modal";
  
  // Step 1: Data type
  dataType: UploadDataType | null;
  
  // Step 2: File upload
  file: ParsedFile | null;
  
  // Step 3: Column mapping
  mappings: ColumnMapping[];
  departmentMappings: Record<string, string>;
  roleMappings: Record<string, string>;
  levelMappings: Record<string, string>;
  customRoleOptions: CustomRoleOption[];
  customLevelOptions: CustomLevelOption[];

  // Per-row overrides applied at import time (rowIndex -> level_id / role_id)
  rowLevelOverrides: Record<number, string>;
  rowRoleOverrides: Record<number, string>;

  // Step 4: Validation
  validationResult: ValidationResult | null;
  excludedRows: Set<number>;
  
  // Step 5: Import
  isImporting: boolean;
  importProgress: number;
  importError: string | null;
  importedCount: number;
  importMode: UploadImportMode;
  multiCurrencyConfirmed: boolean;
  
  // Actions
  setMode: (mode: "page" | "modal") => void;
  setDataType: (type: UploadDataType) => void;
  setFile: (file: ParsedFile | null) => void;
  setMappings: (mappings: ColumnMapping[]) => void;
  setDepartmentMapping: (sourceValue: string, targetValue: string) => void;
  setRoleMapping: (sourceValue: string, targetValue: string) => void;
  setLevelMapping: (sourceValue: string, targetValue: string) => void;
  addCustomRoleOption: (option: CustomRoleOption) => void;
  addCustomLevelOption: (option: CustomLevelOption) => void;
  setRowLevelOverride: (rowIndex: number, levelId: string) => void;
  setRowRoleOverride: (rowIndex: number, roleId: string) => void;
  clearRowOverride: (rowIndex: number) => void;
  updateMapping: (sourceIndex: number, targetField: string | null) => void;
  setValidationResult: (result: ValidationResult) => void;
  setExcludedRows: (rows: Set<number>) => void;
  toggleRowExclusion: (rowIndex: number) => void;
  excludeAllErrors: () => void;
  setImporting: (isImporting: boolean) => void;
  setImportProgress: (progress: number) => void;
  setImportError: (error: string | null) => void;
  setImportedCount: (count: number) => void;
  setImportMode: (mode: UploadImportMode) => void;
  setMultiCurrencyConfirmed: (confirmed: boolean) => void;
  goToStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
};

const STEP_ORDER: WizardStep[] = [
  "data-type",
  "file-upload",
  "column-mapping",
  "department-mapping",
  "role-mapping",
  "level-mapping",
  "validation",
  "auto-fix",
  "error-review",
  "confirm",
  "success",
];

const initialState = {
  currentStep: "data-type" as WizardStep,
  mode: "page" as const,
  dataType: null,
  file: null,
  mappings: [],
  departmentMappings: {},
  roleMappings: {},
  levelMappings: {},
  customRoleOptions: [] as CustomRoleOption[],
  customLevelOptions: [] as CustomLevelOption[],
  rowLevelOverrides: {} as Record<number, string>,
  rowRoleOverrides: {} as Record<number, string>,
  validationResult: null,
  excludedRows: new Set<number>(),
  isImporting: false,
  importProgress: 0,
  importError: null,
  importedCount: 0,
  importMode: "upsert" as UploadImportMode,
  multiCurrencyConfirmed: false,
};

export const useUploadStore = create<UploadState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setMode: (mode) => set({ mode }),

      setDataType: (type) => set({ dataType: type }),

      setFile: (file) => set({ file }),

      setMappings: (mappings) => set({ mappings }),

      setDepartmentMapping: (sourceValue, targetValue) =>
        set((state) => ({
          departmentMappings: {
            ...state.departmentMappings,
            [sourceValue]: targetValue,
          },
        })),

      setRoleMapping: (sourceValue, targetValue) =>
        set((state) => ({
          roleMappings: {
            ...state.roleMappings,
            [sourceValue]: targetValue,
          },
        })),

      setLevelMapping: (sourceValue, targetValue) =>
        set((state) => ({
          levelMappings: {
            ...state.levelMappings,
            [sourceValue]: targetValue,
          },
        })),

      addCustomRoleOption: (option) =>
        set((state) => {
          if (state.customRoleOptions.some((existing) => existing.id === option.id)) {
            return state;
          }
          return {
            customRoleOptions: [...state.customRoleOptions, option],
          };
        }),

      addCustomLevelOption: (option) =>
        set((state) => {
          if (state.customLevelOptions.some((existing) => existing.id === option.id)) {
            return state;
          }
          return {
            customLevelOptions: [...state.customLevelOptions, option],
          };
        }),

      setRowLevelOverride: (rowIndex, levelId) =>
        set((state) => ({
          rowLevelOverrides: {
            ...state.rowLevelOverrides,
            [rowIndex]: levelId,
          },
        })),

      setRowRoleOverride: (rowIndex, roleId) =>
        set((state) => ({
          rowRoleOverrides: {
            ...state.rowRoleOverrides,
            [rowIndex]: roleId,
          },
        })),

      clearRowOverride: (rowIndex) =>
        set((state) => {
          const nextLevels = { ...state.rowLevelOverrides };
          const nextRoles = { ...state.rowRoleOverrides };
          delete nextLevels[rowIndex];
          delete nextRoles[rowIndex];
          return { rowLevelOverrides: nextLevels, rowRoleOverrides: nextRoles };
        }),

      updateMapping: (sourceIndex, targetField) => {
        const { mappings } = get();
        const updated = mappings.map((m) =>
          m.sourceIndex === sourceIndex
            ? { ...m, targetField, confidence: targetField ? 1 : 0 }
            : m
        );
        set({ mappings: updated });
      },

      setValidationResult: (result) => set({ validationResult: result }),

      setExcludedRows: (rows) => set({ excludedRows: new Set(rows) }),

      toggleRowExclusion: (rowIndex) => {
        const { excludedRows } = get();
        const newExcluded = new Set(excludedRows);
        if (newExcluded.has(rowIndex)) {
          newExcluded.delete(rowIndex);
        } else {
          newExcluded.add(rowIndex);
        }
        set({ excludedRows: newExcluded });
      },

      excludeAllErrors: () => {
        const { validationResult } = get();
        if (!validationResult) return;
        
        const errorRows = validationResult.rows
          .filter((r) => !r.isValid)
          .map((r) => r.rowIndex);
        set({ excludedRows: new Set(errorRows) });
      },

      setImporting: (isImporting) => set({ isImporting }),

      setImportProgress: (progress) => set({ importProgress: progress }),

      setImportError: (error) => set({ importError: error }),

      setImportedCount: (count) => set({ importedCount: count }),

      setImportMode: (mode) => set({ importMode: mode }),

      setMultiCurrencyConfirmed: (confirmed) => set({ multiCurrencyConfirmed: confirmed }),

      goToStep: (step) => set({ currentStep: step }),

      nextStep: () => {
        const { currentStep, mode, dataType } = get();
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        
        // In modal mode with preselected type, skip data-type step
        if (currentStep === "data-type" && mode === "modal" && dataType) {
          set({ currentStep: "file-upload" });
          return;
        }
        
        if (currentIndex < STEP_ORDER.length - 1) {
          let nextIndex = currentIndex + 1;
          if (dataType !== "employees") {
            while (
              nextIndex < STEP_ORDER.length &&
              ["department-mapping", "role-mapping", "level-mapping"].includes(STEP_ORDER[nextIndex])
            ) {
              nextIndex += 1;
            }
          }
          set({ currentStep: STEP_ORDER[Math.min(nextIndex, STEP_ORDER.length - 1)] });
        }
      },

      prevStep: () => {
        const { currentStep, mode, dataType } = get();
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        
        // In modal mode with preselected type, can't go back to data-type
        if (currentStep === "file-upload" && mode === "modal" && dataType) {
          return;
        }
        
        if (currentIndex > 0) {
          let prevIndex = currentIndex - 1;
          if (dataType !== "employees") {
            while (
              prevIndex > 0 &&
              ["department-mapping", "role-mapping", "level-mapping"].includes(STEP_ORDER[prevIndex])
            ) {
              prevIndex -= 1;
            }
          }
          set({ currentStep: STEP_ORDER[Math.max(prevIndex, 0)] });
        }
      },

      reset: () => {
        set({
          ...initialState,
          // Keep mode if in modal
          mode: get().mode,
        });
      },
    }),
    {
      name: "qeemly:upload-wizard",
      partialize: (state) => ({
        // Only persist essential state for recovery
        dataType: state.dataType,
        currentStep: state.currentStep,
      }),
    }
  )
);

// Helper to initialize modal mode with preselected type
export function initModalUpload(type: UploadDataType) {
  const store = useUploadStore.getState();
  store.reset();
  store.setMode("modal");
  store.setDataType(type);
  store.goToStep("file-upload");
}

// Helper to get rows that will be imported (valid and not excluded).
// Per-row level/role overrides are merged into row.data so transformers see the corrected values.
export function getRowsToImport(state: UploadState): RowValidationResult[] {
  if (!state.validationResult) return [];
  return state.validationResult.rows
    .filter((row) => row.isValid && !state.excludedRows.has(row.rowIndex))
    .map((row) => applyRowOverrides(row, state));
}

export function applyRowOverrides(
  row: RowValidationResult,
  state: Pick<UploadState, "rowLevelOverrides" | "rowRoleOverrides">,
): RowValidationResult {
  const levelOverride = state.rowLevelOverrides[row.rowIndex];
  const roleOverride = state.rowRoleOverrides[row.rowIndex];
  if (!levelOverride && !roleOverride) return row;

  const data = { ...row.data };
  if (levelOverride) data.level = levelOverride;
  if (roleOverride) data.role = roleOverride;
  return { ...row, data };
}

// Helper to get summary stats for confirmation
export function getImportSummary(state: UploadState) {
  if (!state.validationResult) {
    return { total: 0, importing: 0, excluded: 0, errors: 0 };
  }
  
  const rows = state.validationResult.rows;
  const importing = rows.filter(
    (r) => r.isValid && !state.excludedRows.has(r.rowIndex)
  ).length;
  const excluded = state.excludedRows.size;
  const errors = rows.filter((r) => !r.isValid).length;
  
  return {
    total: rows.length,
    importing,
    excluded,
    errors,
  };
}
