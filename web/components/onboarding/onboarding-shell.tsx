"use client";

import { useCallback } from "react";
import clsx from "clsx";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import {
  useOnboardingStore,
  getOnboardingStepMeta,
  type OnboardingStep,
} from "@/lib/onboarding";

import { WelcomeStep } from "./steps/welcome-step";
import { CompanyProfileStep } from "./steps/company-profile-step";
import { CompensationDefaultsStep } from "./steps/compensation-defaults-step";
import { UploadStep } from "./steps/upload-step";
import { FirstBenchmarkStep } from "./steps/first-benchmark-step";
import { CompleteStep } from "./steps/complete-step";

const STEPS: OnboardingStep[] = [
  "welcome",
  "company_profile",
  "compensation_defaults",
  "upload",
  "first_benchmark",
  "complete",
];

function StepContent({
  step,
  onNext,
}: {
  step: OnboardingStep;
  onNext: () => void;
}) {
  switch (step) {
    case "welcome":
      return <WelcomeStep onNext={onNext} />;
    case "company_profile":
      return <CompanyProfileStep onNext={onNext} />;
    case "compensation_defaults":
      return <CompensationDefaultsStep onNext={onNext} />;
    case "upload":
      return <UploadStep onNext={onNext} />;
    case "first_benchmark":
      return <FirstBenchmarkStep />;
    case "complete":
      return <CompleteStep />;
    default:
      return null;
  }
}

export function OnboardingShell() {
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const isLoading = useOnboardingStore((s) => s.isLoading);

  const currentIndex = STEPS.indexOf(currentStep);
  const meta = getOnboardingStepMeta(currentStep);
  const isFirstStep = currentIndex <= 0;
  const isLastStep = currentStep === "complete";

  const goBack = useCallback(() => {
    if (isFirstStep) return;
    const prevStep = STEPS[currentIndex - 1];
    useOnboardingStore.setState({ currentStep: prevStep });
  }, [currentIndex, isFirstStep]);

  const goNext = useCallback(() => {
    if (currentIndex >= STEPS.length - 1) return;
    const nextStep = STEPS[currentIndex + 1];
    useOnboardingStore.setState({ currentStep: nextStep });
  }, [currentIndex]);

  const totalMinutes = STEPS.reduce(
    (sum, s) => sum + getOnboardingStepMeta(s).estimatedMinutes,
    0,
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-white/80 px-6 py-4 backdrop-blur-sm">
        <Logo href={null} />

        <button
          onClick={() => {
            document.cookie = "onboarding_skipped=1;path=/;max-age=86400";
            window.location.href = "/dashboard";
          }}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Skip for later
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* Progress bar */}
      <div className="border-b border-border/30 bg-brand-50/30 px-6 py-5">
        <div className="mx-auto max-w-2xl">
          {/* Step dots */}
          <div className="flex items-center justify-between gap-2">
            {STEPS.map((step, i) => {
              const isActive = i === currentIndex;
              const isPast = i < currentIndex;
              return (
                <div key={step} className="flex flex-1 items-center gap-2">
                  <div
                    className={clsx(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300",
                      isActive &&
                        "bg-brand-500 text-white ring-4 ring-brand-100",
                      isPast && "bg-brand-500 text-white",
                      !isActive && !isPast && "bg-brand-100 text-brand-400",
                    )}
                  >
                    {isPast ? "✓" : i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={clsx(
                        "h-0.5 flex-1 rounded-full transition-colors duration-300",
                        isPast ? "bg-brand-500" : "bg-brand-100",
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step info */}
          <div className="mt-4 text-center">
            <p className="text-sm font-medium text-brand-900">{meta.title}</p>
            <p className="mt-0.5 text-xs text-brand-500">
              {meta.description}
              {meta.estimatedMinutes > 0 &&
                ` · About ${meta.estimatedMinutes} min`}
            </p>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <main className="mx-auto max-w-2xl px-6 py-10">
        <StepContent step={currentStep} onNext={goNext} />
      </main>

      {/* Bottom navigation */}
      {!isLastStep && currentStep !== "welcome" && (
        <footer className="sticky bottom-0 z-30 border-t border-border/40 bg-white/80 px-6 py-4 backdrop-blur-sm">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              disabled={isFirstStep || isLoading}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back
            </Button>

            <p className="text-xs text-brand-400">
              Step {currentIndex + 1} of {STEPS.length} · ~{totalMinutes} min
              total
            </p>

            <div className="w-20" />
          </div>
        </footer>
      )}
    </div>
  );
}
