// Client onboarding flow state, persisted locally and synced from GET/PATCH /api/onboarding.

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OnboardingStep =
  | "welcome"
  | "company_profile"
  | "compensation_defaults"
  | "upload"
  | "first_benchmark"
  | "complete";

export type OnboardingStepStatus = {
  completedAt: string | null;
  skippedAt?: string | null;
};

export type OnboardingState = {
  steps: {
    company_profile: OnboardingStepStatus;
    compensation_defaults: OnboardingStepStatus;
    upload: OnboardingStepStatus & { skippedAt: string | null };
    first_benchmark: OnboardingStepStatus;
  };
  currentStep: OnboardingStep;
  isComplete: boolean;
  canBenchmark: boolean;
  startedAt: string | null;
  completedAt: string | null;
};

export type OnboardingStepMeta = {
  title: string;
  description: string;
  estimatedMinutes: number;
};

const defaultOnboardingState: OnboardingState = {
  steps: {
    company_profile: { completedAt: null },
    compensation_defaults: { completedAt: null },
    upload: { completedAt: null, skippedAt: null },
    first_benchmark: { completedAt: null },
  },
  currentStep: "welcome",
  isComplete: false,
  canBenchmark: false,
  startedAt: null,
  completedAt: null,
};

const ONBOARDING_STEPS = [
  "welcome",
  "company_profile",
  "compensation_defaults",
  "upload",
  "first_benchmark",
  "complete",
] as const satisfies readonly OnboardingStep[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pickOnboardingPayload(json: unknown): unknown {
  if (!isRecord(json)) return null;
  if ("onboarding" in json && isRecord(json.onboarding)) return json.onboarding;
  return json;
}

function looksLikeOnboardingPayload(value: unknown): boolean {
  return isRecord(value) && isRecord(value.steps);
}

function readCompletedAt(raw: unknown): string | null {
  if (!isRecord(raw)) return null;
  const value = raw.completedAt;
  if (typeof value === "string") return value;
  return null;
}

function coerceOnboardingState(raw: unknown): OnboardingState {
  if (!isRecord(raw)) return { ...defaultOnboardingState };

  const stepsRaw = isRecord(raw.steps) ? raw.steps : {};
  const company = stepsRaw.company_profile;
  const compensation = stepsRaw.compensation_defaults;
  const firstBench = stepsRaw.first_benchmark;

  // Support both new shape (upload_completed/upload_skipped) and legacy (upload).
  const uploadCompleted = stepsRaw.upload_completed;
  const uploadSkipped = stepsRaw.upload_skipped;
  const legacyUpload = isRecord(stepsRaw.upload) ? stepsRaw.upload : null;
  const uploadCompletedAt =
    readCompletedAt(uploadCompleted) ??
    (legacyUpload && typeof legacyUpload.completedAt === "string" ? legacyUpload.completedAt : null);
  const uploadSkippedAt =
    readCompletedAt(uploadSkipped) ??
    (legacyUpload && typeof legacyUpload.skippedAt === "string" ? legacyUpload.skippedAt : null);

  const currentStep =
    typeof raw.currentStep === "string" &&
    (ONBOARDING_STEPS as readonly string[]).includes(raw.currentStep)
      ? (raw.currentStep as OnboardingStep)
      : defaultOnboardingState.currentStep;

  return {
    steps: {
      company_profile: { completedAt: readCompletedAt(company) },
      compensation_defaults: { completedAt: readCompletedAt(compensation) },
      upload: { completedAt: uploadCompletedAt, skippedAt: uploadSkippedAt },
      first_benchmark: { completedAt: readCompletedAt(firstBench) },
    },
    currentStep,
    isComplete: typeof raw.isComplete === "boolean" ? raw.isComplete : defaultOnboardingState.isComplete,
    canBenchmark:
      typeof raw.canBenchmark === "boolean" ? raw.canBenchmark : defaultOnboardingState.canBenchmark,
    startedAt:
      typeof raw.startedAt === "string" || raw.startedAt === null
        ? (raw.startedAt as string | null)
        : defaultOnboardingState.startedAt,
    completedAt:
      typeof raw.completedAt === "string" || raw.completedAt === null
        ? (raw.completedAt as string | null)
        : defaultOnboardingState.completedAt,
  };
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (isRecord(body) && typeof body.error === "string") return body.error;
    if (isRecord(body) && typeof body.message === "string") return body.message;
  } catch {
    // fall through
  }
  return res.statusText || `Request failed (${res.status})`;
}

type OnboardingStore = OnboardingState & {
  isLoading: boolean;
  error: string | null;
  fetchOnboarding: () => Promise<void>;
  completeStep: (step: string) => Promise<void>;
  skipUpload: () => Promise<void>;
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      ...defaultOnboardingState,
      isLoading: false,
      error: null,

      fetchOnboarding: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch("/api/onboarding");
          if (!res.ok) {
            set({ error: await readErrorMessage(res), isLoading: false });
            return;
          }
          const json: unknown = await res.json();
          const payload = pickOnboardingPayload(json);
          if (payload === null || !looksLikeOnboardingPayload(payload)) {
            set({ error: "Invalid onboarding response.", isLoading: false });
            return;
          }
          set({ ...coerceOnboardingState(payload), isLoading: false, error: null });
        } catch (e) {
          const message = e instanceof Error ? e.message : "Failed to load onboarding.";
          set({ error: message, isLoading: false });
        }
      },

      completeStep: async (step: string) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch("/api/onboarding", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ step }),
          });
          if (!res.ok) {
            set({ error: await readErrorMessage(res), isLoading: false });
            return;
          }
          const json: unknown = await res.json().catch(() => null);
          const payload = json === null ? null : pickOnboardingPayload(json);
          if (payload !== null && looksLikeOnboardingPayload(payload)) {
            set({ ...coerceOnboardingState(payload), isLoading: false, error: null });
            return;
          }
          await get().fetchOnboarding();
        } catch (e) {
          const message = e instanceof Error ? e.message : "Failed to update onboarding.";
          set({ error: message, isLoading: false });
        }
      },

      skipUpload: async () => {
        await get().completeStep("upload_skipped");
      },
    }),
    {
      name: "qeemly-onboarding",
      partialize: (s) => ({
        steps: s.steps,
        currentStep: s.currentStep,
        isComplete: s.isComplete,
        canBenchmark: s.canBenchmark,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
      }),
    },
  ),
);

const STEP_META: Record<OnboardingStep, OnboardingStepMeta> = {
  welcome: {
    title: "Welcome to Qeemly",
    description: "A quick overview of what you will set up in your workspace.",
    estimatedMinutes: 1,
  },
  company_profile: {
    title: "Company profile",
    description: "Tell us about your company so benchmarks stay relevant.",
    estimatedMinutes: 3,
  },
  compensation_defaults: {
    title: "Compensation defaults",
    description: "Set currency, review cadence, and default assumptions for analyses.",
    estimatedMinutes: 2,
  },
  upload: {
    title: "Upload employee data",
    description: "Import a spreadsheet so roles and pay line up with market data.",
    estimatedMinutes: 5,
  },
  first_benchmark: {
    title: "First benchmark",
    description: "Run your first market comparison against your imported roster.",
    estimatedMinutes: 3,
  },
  complete: {
    title: "You are ready",
    description: "Onboarding is complete. You can revisit settings anytime.",
    estimatedMinutes: 0,
  },
};

export function getOnboardingStepMeta(step: OnboardingStep): OnboardingStepMeta {
  return STEP_META[step];
}
