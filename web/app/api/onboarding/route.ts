import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace-context";

const ONBOARDING_SELECT = [
  "onboarding_company_profile_completed_at",
  "onboarding_compensation_defaults_completed_at",
  "onboarding_upload_completed_at",
  "onboarding_upload_skipped_at",
  "onboarding_first_benchmark_completed_at",
  "onboarding_completed_at",
  "onboarding_started_at",
  "is_configured",
].join(", ");

export type OnboardingPatchStep =
  | "company_profile"
  | "compensation_defaults"
  | "upload_completed"
  | "upload_skipped"
  | "first_benchmark"
  | "completed";

const VALID_STEPS: OnboardingPatchStep[] = [
  "company_profile",
  "compensation_defaults",
  "upload_completed",
  "upload_skipped",
  "first_benchmark",
  "completed",
];

type StepStatus = { completed: boolean; completedAt: string | null };

export type OnboardingStateResponse = {
  steps: {
    company_profile: StepStatus;
    compensation_defaults: StepStatus;
    upload_completed: StepStatus;
    upload_skipped: StepStatus;
    first_benchmark: StepStatus;
    completed: StepStatus;
  };
  currentStep:
    | "company_profile"
    | "compensation_defaults"
    | "upload"
    | "first_benchmark"
    | "complete";
  isComplete: boolean;
  canBenchmark: boolean;
  startedAt: string | null;
  completedAt: string | null;
};

type SettingsOnboardingRow = {
  onboarding_company_profile_completed_at: string | null;
  onboarding_compensation_defaults_completed_at: string | null;
  onboarding_upload_completed_at: string | null;
  onboarding_upload_skipped_at: string | null;
  onboarding_first_benchmark_completed_at: string | null;
  onboarding_completed_at: string | null;
  onboarding_started_at: string | null;
  is_configured?: boolean | null;
};

function buildOnboardingState(row: SettingsOnboardingRow | null): OnboardingStateResponse {
  const at = (v: string | null | undefined) => (v ? String(v) : null);
  const step = (timestamp: string | null): StepStatus => ({
    completed: timestamp !== null,
    completedAt: timestamp,
  });

  const companyAt = at(row?.onboarding_company_profile_completed_at);
  const compDefaultsAt = at(row?.onboarding_compensation_defaults_completed_at);
  const uploadDoneAt = at(row?.onboarding_upload_completed_at);
  const uploadSkipAt = at(row?.onboarding_upload_skipped_at);
  const firstBenchAt = at(row?.onboarding_first_benchmark_completed_at);
  const completedAt = at(row?.onboarding_completed_at);
  const startedAt = at(row?.onboarding_started_at);

  const steps: OnboardingStateResponse["steps"] = {
    company_profile: step(companyAt),
    compensation_defaults: step(compDefaultsAt),
    upload_completed: step(uploadDoneAt),
    upload_skipped: step(uploadSkipAt),
    first_benchmark: step(firstBenchAt),
    completed: step(completedAt),
  };

  const isComplete = !!completedAt;
  const canBenchmark = !!companyAt && !!compDefaultsAt;
  const uploadHandled = !!uploadDoneAt || !!uploadSkipAt;

  let currentStep: OnboardingStateResponse["currentStep"] = "company_profile";
  if (isComplete) {
    currentStep = "complete";
  } else if (!companyAt) {
    currentStep = "company_profile";
  } else if (!compDefaultsAt) {
    currentStep = "compensation_defaults";
  } else if (!uploadHandled) {
    currentStep = "upload";
  } else if (!firstBenchAt) {
    currentStep = "first_benchmark";
  } else {
    currentStep = "complete";
  }

  return { steps, currentStep, isComplete, canBenchmark, startedAt, completedAt };
}

function patchPayloadForStep(step: OnboardingPatchStep, nowIso: string): Record<string, unknown> {
  switch (step) {
    case "company_profile":
      return { onboarding_company_profile_completed_at: nowIso, onboarding_started_at: nowIso };
    case "compensation_defaults":
      return { onboarding_compensation_defaults_completed_at: nowIso };
    case "upload_completed":
      return { onboarding_upload_completed_at: nowIso };
    case "upload_skipped":
      return { onboarding_upload_skipped_at: nowIso };
    case "first_benchmark":
      return { onboarding_first_benchmark_completed_at: nowIso };
    case "completed":
      return { onboarding_completed_at: nowIso, is_configured: true };
    default: {
      const _exhaustive: never = step;
      return _exhaustive;
    }
  }
}

/**
 * GET /api/onboarding
 * Returns onboarding progress for the current workspace.
 */
export async function GET() {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { workspace_id } = wsContext.context;

  const { data: row, error } = await supabase
    .from("workspace_settings")
    .select(ONBOARDING_SELECT)
    .eq("workspace_id", workspace_id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(buildOnboardingState((row as SettingsOnboardingRow | null) ?? null));
}

/**
 * PATCH /api/onboarding
 * Marks an onboarding step complete (admin or super admin).
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { workspace_id, is_super_admin, user_id } = wsContext.context;

  if (!is_super_admin) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user_id).single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const step = typeof body === "object" && body !== null && "step" in body ? (body as { step: unknown }).step : null;
  if (typeof step !== "string" || !VALID_STEPS.includes(step as OnboardingPatchStep)) {
    return NextResponse.json({ error: "Invalid or missing step" }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  const stepKey = step as OnboardingPatchStep;
  const columnUpdates = patchPayloadForStep(stepKey, nowIso);

  const { data: existing } = await supabase
    .from("workspace_settings")
    .select("id, onboarding_started_at")
    .eq("workspace_id", workspace_id)
    .maybeSingle();

  // Only set onboarding_started_at if not already set (idempotent)
  if (existing?.onboarding_started_at && columnUpdates.onboarding_started_at) {
    delete columnUpdates.onboarding_started_at;
  }

  const writePayload = {
    ...columnUpdates,
    updated_at: nowIso,
  };

  let resultRow: SettingsOnboardingRow | null = null;
  let writeError: { message: string } | null = null;

  if (existing) {
    const writeResult = await supabase
      .from("workspace_settings")
      .update(writePayload)
      .eq("workspace_id", workspace_id)
      .select(ONBOARDING_SELECT)
      .single();
    resultRow = writeResult.data as SettingsOnboardingRow | null;
    writeError = writeResult.error;
  } else {
    const writeResult = await supabase
      .from("workspace_settings")
      .insert({
        workspace_id,
        ...writePayload,
      })
      .select(ONBOARDING_SELECT)
      .single();
    resultRow = writeResult.data as SettingsOnboardingRow | null;
    writeError = writeResult.error;
  }

  if (writeError) {
    return NextResponse.json({ error: writeError.message }, { status: 500 });
  }

  return NextResponse.json(buildOnboardingState(resultRow));
}
