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
  | "validation"
  | "confirm"
  | "success";

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
  
  // Step 4: Validation
  validationResult: ValidationResult | null;
  excludedRows: Set<number>;
  
  // Step 5: Import
  isImporting: boolean;
  importProgress: number;
  importError: string | null;
  importedCount: number;
  
  // Actions
  setMode: (mode: "page" | "modal") => void;
  setDataType: (type: UploadDataType) => void;
  setFile: (file: ParsedFile) => void;
  setMappings: (mappings: ColumnMapping[]) => void;
  updateMapping: (sourceIndex: number, targetField: string | null) => void;
  setValidationResult: (result: ValidationResult) => void;
  toggleRowExclusion: (rowIndex: number) => void;
  excludeAllErrors: () => void;
  setImporting: (isImporting: boolean) => void;
  setImportProgress: (progress: number) => void;
  setImportError: (error: string | null) => void;
  setImportedCount: (count: number) => void;
  goToStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
};

const STEP_ORDER: WizardStep[] = [
  "data-type",
  "file-upload",
  "column-mapping",
  "validation",
  "confirm",
  "success",
];

const initialState = {
  currentStep: "data-type" as WizardStep,
  mode: "page" as const,
  dataType: null,
  file: null,
  mappings: [],
  validationResult: null,
  excludedRows: new Set<number>(),
  isImporting: false,
  importProgress: 0,
  importError: null,
  importedCount: 0,
};

export const useUploadStore = create<UploadState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setMode: (mode) => set({ mode }),

      setDataType: (type) => set({ dataType: type }),

      setFile: (file) => set({ file }),

      setMappings: (mappings) => set({ mappings }),

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
          set({ currentStep: STEP_ORDER[currentIndex + 1] });
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
          set({ currentStep: STEP_ORDER[currentIndex - 1] });
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

// Helper to get rows that will be imported (valid and not excluded)
export function getRowsToImport(state: UploadState): RowValidationResult[] {
  if (!state.validationResult) return [];
  return state.validationResult.rows.filter(
    (row) => row.isValid && !state.excludedRows.has(row.rowIndex)
  );
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
