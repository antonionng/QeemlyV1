/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  uploadEmployeesMock,
  createUploadRecordMock,
  prevStepMock,
  resetMock,
  goToStepMock,
  storeState,
  storeListeners,
} = vi.hoisted(() => ({
  uploadEmployeesMock: vi.fn(),
  createUploadRecordMock: vi.fn(),
  prevStepMock: vi.fn(),
  resetMock: vi.fn(),
  goToStepMock: vi.fn(),
  storeState: {
    currentStep: "confirm",
    dataType: "employees",
    file: { fileName: "employees.csv", fileSize: 1200 },
    isImporting: false,
    importProgress: 0,
    importError: null as string | null,
    importedCount: 0,
    importMode: "upsert",
  },
  storeListeners: new Set<() => void>(),
}));

function notifyStore() {
  for (const listener of storeListeners) {
    listener();
  }
}

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a"> & { href: string }) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("lucide-react", () => ({
  Upload: () => React.createElement("svg"),
  Check: () => React.createElement("svg"),
  AlertCircle: () => React.createElement("svg"),
  Users: () => React.createElement("svg"),
  BarChart3: () => React.createElement("svg"),
  DollarSign: () => React.createElement("svg"),
  ArrowRight: () => React.createElement("svg"),
  ExternalLink: () => React.createElement("svg"),
}));

vi.mock("@/lib/upload", () => ({
  useUploadStore: () => {
    const [, forceRender] = React.useReducer((value: number) => value + 1, 0);

    React.useEffect(() => {
      const listener = () => forceRender();
      storeListeners.add(listener);
      return () => {
        storeListeners.delete(listener);
      };
    }, []);

    return {
      ...storeState,
      setImporting: (value: boolean) => {
        storeState.isImporting = value;
        notifyStore();
      },
      setImportProgress: (value: number) => {
        storeState.importProgress = value;
        notifyStore();
      },
      setImportError: (value: string | null) => {
        storeState.importError = value;
        notifyStore();
      },
      setImportedCount: (value: number) => {
        storeState.importedCount = value;
        notifyStore();
      },
      goToStep: (value: string) => {
        goToStepMock(value);
        storeState.currentStep = value;
        notifyStore();
      },
      reset: () => {
        resetMock();
      },
      prevStep: () => {
        prevStepMock();
      },
    };
  },
  buildUploadedBenchmarkPreviewRows: () => [],
  getConfirmSummaryCopy: () => ({
    title: "Review this upload",
    body: "Check the summary before importing.",
  }),
  getImportSummary: () => ({
    total: 2,
    importing: 2,
    excluded: 0,
    errors: 0,
  }),
  getRowsToImport: () => [{ data: { email: "a@example.com" } }, { data: { email: "b@example.com" } }],
  fetchUploadVerificationSummary: vi.fn(),
  fetchUploadedBenchmarkResults: vi.fn(),
  fetchUploadedEmployeeResults: vi.fn(),
  buildUploadedEmployeePreviewRows: () => [],
  uploadEmployees: uploadEmployeesMock,
  uploadBenchmarks: vi.fn(),
  uploadCompensationUpdates: vi.fn(),
  createUploadRecord: createUploadRecordMock,
  transformEmployee: () => ({
    firstName: "Ava",
    lastName: "Stone",
    email: "ava@example.com",
  }),
  transformBenchmark: vi.fn(),
  transformCompensationUpdate: vi.fn(),
}));

import { StepConfirm } from "@/components/dashboard/upload/step-confirm";

describe("StepConfirm error surface", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.clearAllMocks();
    storeListeners.clear();
    storeState.currentStep = "confirm";
    storeState.dataType = "employees";
    storeState.file = { fileName: "employees.csv", fileSize: 1200 };
    storeState.isImporting = false;
    storeState.importProgress = 0;
    storeState.importError = null;
    storeState.importedCount = 0;
    storeState.importMode = "upsert";
    uploadEmployeesMock.mockResolvedValue({
      success: false,
      insertedCount: 0,
      createdCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      failedCount: 2,
      errors: [
        "Row 2 salary must be a number. Example: 50000",
        "Row 5 email is already in use. Use a different email address.",
      ],
    });
    createUploadRecordMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    container.remove();
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
      .IS_REACT_ACT_ENVIRONMENT;
  });

  it("renders upload issues as separate lines instead of one joined string", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(StepConfirm));
      await Promise.resolve();
    });

    const importButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Import 2 Records"),
    );

    expect(importButton).toBeTruthy();

    await act(async () => {
      importButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Import failed");
    expect(container.textContent).toContain("Row 2 salary must be a number. Example: 50000");
    expect(container.textContent).toContain("Row 5 email is already in use. Use a different email address.");
    expect(container.textContent).not.toContain(
      "Row 2 salary must be a number. Example: 50000, Row 5 email is already in use. Use a different email address.",
    );

    await act(async () => {
      root.unmount();
    });
  });
});
