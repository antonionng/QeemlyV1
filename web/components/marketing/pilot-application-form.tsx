"use client";

import { useId, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PILOT_COMPANY_SIZE_OPTIONS,
  validatePilotApplication,
  type PilotApplicationPayload,
} from "@/lib/marketing/pilot-application";

type PilotApplicationFormProps = {
  sourceCta: string;
};

type FormState = Omit<PilotApplicationPayload, "sourceCta" | "sourcePath">;
type Errors = Partial<Record<keyof FormState | "form", string>>;

const INITIAL_STATE: FormState = {
  name: "",
  jobRole: "",
  company: "",
  companySize: "",
  industry: "",
  workEmail: "",
  phoneOrWhatsapp: "",
};

export function PilotApplicationForm({ sourceCta }: PilotApplicationFormProps) {
  const [state, setState] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const fieldIds = {
    name: useId(),
    jobRole: useId(),
    company: useId(),
    companySize: useId(),
    industry: useId(),
    workEmail: useId(),
    phoneOrWhatsapp: useId(),
  };

  function updateField<Key extends keyof FormState>(field: Key, value: FormState[Key]) {
    setState((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("idle");

    const nextErrors = validatePilotApplication(state);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setStatus("submitting");

    try {
      const response = await fetch("/api/pilot-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...state,
          sourceCta,
          sourcePath: typeof window === "undefined" ? "" : window.location.pathname,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { errors?: Record<string, string>; error?: string; ok?: boolean }
        | null;

      if (!response.ok) {
        setErrors({
          ...(payload?.errors ?? {}),
          form: payload?.error ?? "Something went wrong. Please try again.",
        });
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrors({ form: "Network error. Please try again." });
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-[2rem] border border-border bg-brand-50/60 p-6 text-brand-900" aria-live="polite">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white ring-1 ring-border">
            <CheckCircle2 className="h-5 w-5 text-brand-700" />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-brand-600">Application received</div>
            <h3 className="text-2xl font-semibold">Thanks. We will review this personally.</h3>
            <p className="text-sm text-brand-700">
              We focus on a small number of high-fit pilot users and will follow up with the right next step.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor={fieldIds.name} className="block text-xs font-bold uppercase tracking-wider text-brand-500">
            Name
          </label>
          <Input
            id={fieldIds.name}
            value={state.name}
            onChange={(event) => updateField("name", event.target.value)}
            onInput={(event) => updateField("name", (event.target as HTMLInputElement).value)}
            placeholder="Your name"
            fullWidth
            aria-invalid={Boolean(errors.name)}
            className={errors.name ? "border-red-300 focus:border-red-400" : ""}
          />
          {errors.name ? <div className="text-xs text-red-600">{errors.name}</div> : null}
        </div>

        <div className="space-y-1">
          <label htmlFor={fieldIds.jobRole} className="block text-xs font-bold uppercase tracking-wider text-brand-500">
            Job role
          </label>
          <Input
            id={fieldIds.jobRole}
            value={state.jobRole}
            onChange={(event) => updateField("jobRole", event.target.value)}
            onInput={(event) => updateField("jobRole", (event.target as HTMLInputElement).value)}
            placeholder="e.g. Head of People"
            fullWidth
            aria-invalid={Boolean(errors.jobRole)}
            className={errors.jobRole ? "border-red-300 focus:border-red-400" : ""}
          />
          {errors.jobRole ? <div className="text-xs text-red-600">{errors.jobRole}</div> : null}
        </div>

        <div className="space-y-1">
          <label htmlFor={fieldIds.company} className="block text-xs font-bold uppercase tracking-wider text-brand-500">
            Company
          </label>
          <Input
            id={fieldIds.company}
            value={state.company}
            onChange={(event) => updateField("company", event.target.value)}
            onInput={(event) => updateField("company", (event.target as HTMLInputElement).value)}
            placeholder="Company name"
            fullWidth
            aria-invalid={Boolean(errors.company)}
            className={errors.company ? "border-red-300 focus:border-red-400" : ""}
          />
          {errors.company ? <div className="text-xs text-red-600">{errors.company}</div> : null}
        </div>

        <div className="space-y-1">
          <label htmlFor={fieldIds.companySize} className="block text-xs font-bold uppercase tracking-wider text-brand-500">
            Company size
          </label>
          <select
            id={fieldIds.companySize}
            value={state.companySize}
            onChange={(event) => setState((current) => ({ ...current, companySize: event.target.value }))}
            aria-invalid={Boolean(errors.companySize)}
            className="h-12 w-full rounded-full border border-border bg-white px-4 text-sm text-foreground focus:border-brand-300 focus:outline-none"
          >
            <option value="">Select…</option>
            {PILOT_COMPANY_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.companySize ? <div className="text-xs text-red-600">{errors.companySize}</div> : null}
        </div>

        <div className="space-y-1">
          <label htmlFor={fieldIds.industry} className="block text-xs font-bold uppercase tracking-wider text-brand-500">
            Industry
          </label>
          <Input
            id={fieldIds.industry}
            value={state.industry}
            onChange={(event) => updateField("industry", event.target.value)}
            onInput={(event) => updateField("industry", (event.target as HTMLInputElement).value)}
            placeholder="e.g. Fintech"
            fullWidth
            aria-invalid={Boolean(errors.industry)}
            className={errors.industry ? "border-red-300 focus:border-red-400" : ""}
          />
          {errors.industry ? <div className="text-xs text-red-600">{errors.industry}</div> : null}
        </div>

        <div className="space-y-1">
          <label htmlFor={fieldIds.workEmail} className="block text-xs font-bold uppercase tracking-wider text-brand-500">
            Work email
          </label>
          <Input
            id={fieldIds.workEmail}
            value={state.workEmail}
            onChange={(event) => updateField("workEmail", event.target.value)}
            onInput={(event) => updateField("workEmail", (event.target as HTMLInputElement).value)}
            placeholder="name@company.com"
            inputMode="email"
            fullWidth
            aria-invalid={Boolean(errors.workEmail)}
            className={errors.workEmail ? "border-red-300 focus:border-red-400" : ""}
          />
          {errors.workEmail ? <div className="text-xs text-red-600">{errors.workEmail}</div> : null}
        </div>
      </div>

      <div className="space-y-1">
        <label
          htmlFor={fieldIds.phoneOrWhatsapp}
          className="block text-xs font-bold uppercase tracking-wider text-brand-500"
        >
          Phone / WhatsApp
        </label>
        <Input
          id={fieldIds.phoneOrWhatsapp}
          value={state.phoneOrWhatsapp}
          onChange={(event) => updateField("phoneOrWhatsapp", event.target.value)}
          onInput={(event) => updateField("phoneOrWhatsapp", (event.target as HTMLInputElement).value)}
          placeholder="+971 50 123 4567"
          fullWidth
        />
        <div className="text-xs text-brand-700/70">Optional, but helpful for fast personal follow-up.</div>
      </div>

      {errors.form ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errors.form}</div> : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" fullWidth disabled={status === "submitting"}>
          {status === "submitting" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting…
            </>
          ) : (
            "Submit application"
          )}
        </Button>
      </div>
    </form>
  );
}
