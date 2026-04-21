"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import clsx from "clsx";
import { Check, ChevronLeft, X } from "lucide-react";
import {
  getUploadHeaderSubtitle,
  useUploadStore,
  type WizardStep,
  type UploadDataType,
} from "@/lib/upload";
import { StepDataType } from "./step-data-type";

const stepLoading = () => <StepLoading />;

const StepFileUpload = dynamic(
  () => import("./step-file-upload").then((m) => ({ default: m.StepFileUpload })),
  { ssr: false, loading: stepLoading },
);
const StepColumnMapping = dynamic(
  () => import("./step-column-mapping").then((m) => ({ default: m.StepColumnMapping })),
  { ssr: false, loading: stepLoading },
);
const StepDepartmentMapping = dynamic(
  () => import("./step-department-mapping").then((m) => ({ default: m.StepDepartmentMapping })),
  { ssr: false, loading: stepLoading },
);
const StepRoleMapping = dynamic(
  () => import("./step-role-mapping").then((m) => ({ default: m.StepRoleMapping })),
  { ssr: false, loading: stepLoading },
);
const StepLevelMapping = dynamic(
  () => import("./step-level-mapping").then((m) => ({ default: m.StepLevelMapping })),
  { ssr: false, loading: stepLoading },
);
const StepValidation = dynamic(
  () => import("./step-validation").then((m) => ({ default: m.StepValidation })),
  { ssr: false, loading: stepLoading },
);
const StepAutoFix = dynamic(
  () => import("./step-auto-fix").then((m) => ({ default: m.StepAutoFix })),
  { ssr: false, loading: stepLoading },
);
const StepErrorReview = dynamic(
  () => import("./step-error-review").then((m) => ({ default: m.StepErrorReview })),
  { ssr: false, loading: stepLoading },
);
const StepConfirm = dynamic(
  () => import("./step-confirm").then((m) => ({ default: m.StepConfirm })),
  { ssr: false, loading: stepLoading },
);

function StepLoading() {
  return (
    <div className="flex h-[400px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
    </div>
  );
}

type UploadWizardProps = {
  mode?: "page" | "modal";
  preselectedType?: UploadDataType;
  onClose?: () => void;
  onSuccess?: () => void;
};

const STEPS: { id: WizardStep; label: string }[] = [
  { id: "data-type", label: "Data Type" },
  { id: "file-upload", label: "Upload File" },
  { id: "column-mapping", label: "Map Columns" },
  { id: "department-mapping", label: "Map Departments" },
  { id: "role-mapping", label: "Map Roles" },
  { id: "level-mapping", label: "Map Levels" },
  { id: "validation", label: "Validate" },
  { id: "auto-fix", label: "Auto-fix" },
  { id: "error-review", label: "Error Review" },
  { id: "confirm", label: "Import" },
];

export function UploadWizard({
  mode = "page",
  preselectedType,
  onClose,
  onSuccess,
}: UploadWizardProps) {
  const {
    currentStep,
    dataType,
    setMode,
    setDataType,
    goToStep,
    prevStep,
    reset,
  } = useUploadStore();

  // Initialize wizard mode and preselected type
  useEffect(() => {
    setMode(mode);
    if (preselectedType) {
      setDataType(preselectedType);
      goToStep("file-upload");
    }
  }, [mode, preselectedType, setMode, setDataType, goToStep]);

  // Filter steps for modal mode
  const visibleSteps = preselectedType
    ? STEPS.filter((s) => s.id !== "data-type")
    : STEPS;

  const currentStepIndex = visibleSteps.findIndex((s) => s.id === currentStep);
  const isSuccess = currentStep === "success";

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const handleBack = () => {
    if (currentStep === "file-upload" && preselectedType) {
      // Can't go back from first step in modal mode
      return;
    }
    prevStep();
  };

  const canGoBack =
    currentStepIndex > 0 && !isSuccess && currentStep !== "confirm";

  return (
    <div className={clsx("flex flex-col", mode === "page" ? "h-full" : "h-full max-h-[90vh]")}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
        <div className="flex items-center gap-3">
          {canGoBack && (
            <button
              onClick={handleBack}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-700 hover:bg-brand-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-semibold text-brand-900">
              {isSuccess ? "Import Complete" : "Upload Data"}
            </h1>
            {dataType && !isSuccess && (
              <p className="text-sm text-brand-600">{getUploadHeaderSubtitle(dataType)}</p>
            )}
          </div>
        </div>
        {mode === "modal" && (
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-700 hover:bg-brand-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Progress Steps */}
      {!isSuccess && (
        <div className="border-b border-border/50 px-6 py-4">
          <div className="flex items-center justify-between">
            {visibleSteps.map((step, index) => {
              const isCurrent = step.id === currentStep;
              const isComplete = currentStepIndex > index;
              const isClickable = isComplete && currentStep !== "confirm";

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => isClickable && goToStep(step.id)}
                    disabled={!isClickable}
                    className={clsx(
                      "flex items-center gap-2",
                      isClickable && "cursor-pointer"
                    )}
                  >
                    <div
                      className={clsx(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                        isCurrent && "bg-brand-500 text-white",
                        isComplete && "bg-green-500 text-white",
                        !isCurrent && !isComplete && "bg-brand-100 text-brand-600"
                      )}
                    >
                      {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                    </div>
                    <span
                      className={clsx(
                        "text-sm font-medium hidden sm:block",
                        isCurrent && "text-brand-900",
                        !isCurrent && "text-brand-600"
                      )}
                    >
                      {step.label}
                    </span>
                  </button>
                  {index < visibleSteps.length - 1 && (
                    <div
                      className={clsx(
                        "mx-3 h-px flex-1 min-w-[20px] sm:min-w-[40px]",
                        isComplete ? "bg-green-500" : "bg-brand-200"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto">
        {currentStep === "data-type" && <StepDataType />}
        {currentStep === "file-upload" && <StepFileUpload />}
        {currentStep === "column-mapping" && <StepColumnMapping />}
        {currentStep === "department-mapping" && <StepDepartmentMapping />}
        {currentStep === "role-mapping" && <StepRoleMapping />}
        {currentStep === "level-mapping" && <StepLevelMapping />}
        {currentStep === "validation" && <StepValidation />}
        {currentStep === "auto-fix" && <StepAutoFix />}
        {currentStep === "error-review" && <StepErrorReview />}
        {(currentStep === "confirm" || currentStep === "success") && (
          <StepConfirm onSuccess={onSuccess} onClose={handleClose} />
        )}
      </div>
    </div>
  );
}
