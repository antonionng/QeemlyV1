"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Info, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type AiRulesModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const RULES: Array<{ title: string; body: string }> = [
  {
    title: "Pool starts from your selection",
    body: "Only employees you check in the wizard make it into the AI's pool. Everyone else is invisible to the model.",
  },
  {
    title: "Eligibility filters can exclude employees",
    body: "Optional rules (recent hires under 1 year, low performers, exact-benchmark-only) flag employees as Excluded. They appear in the table with a clear reason and never receive an increase.",
  },
  {
    title: "Benchmark provenance drives confidence",
    body: "Workspace benchmarks are preferred over Qeemly Ingestion. Employees with no benchmark match still appear, but their suggestion uses internal signals and earns lower confidence.",
  },
  {
    title: "Score is a weighted blend of signals",
    body: "We combine market gap, performance rating, current band position, and tenure. Each scenario reweights these signals to match its objective (Balanced, Retention, Performance, Market Alignment).",
  },
  {
    title: "Allocation respects budget and caps",
    body: "Each eligible employee gets a share proportional to base salary times their score multiplier. The total share is normalized to fit the configured budget. The Max-Increase-% rule clamps individual outcomes.",
  },
  {
    title: "Per-employee suggestions match the pool",
    body: "The Why AI suggested this drawer reflects the same factors and benchmark provenance that drove the cohort allocation, so per-employee guidance never contradicts the wizard output.",
  },
];

export function AiSelectionRulesModal({ isOpen, onClose }: AiRulesModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close AI rules modal"
        className="absolute inset-0 bg-accent-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl border border-border bg-white shadow-2xl">
        <div className="h-1.5 bg-gradient-to-r from-brand-500 via-brand-400 to-sky-500" />
        <div className="flex items-start justify-between gap-4 border-b border-border/50 bg-brand-50/40 px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-accent-900">How Qeemly AI selects employees</h2>
              <p className="text-sm text-accent-600">
                A short explainer on the rules that drive AI scenarios and per-employee suggestions.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-accent-500 hover:bg-accent-100 hover:text-accent-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(85vh-160px)] overflow-y-auto px-6 py-5">
          <ol className="space-y-4">
            {RULES.map((rule, idx) => (
              <li key={rule.title} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                  {idx + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-accent-900">{rule.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-accent-600">{rule.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex items-start gap-2 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 text-xs text-brand-700">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              All AI outputs are advisory. You are always in control: review the
              factors in each row, adjust selections, and apply only the
              recommendations that match your context.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-border/50 bg-white px-6 py-4">
          <Button onClick={onClose}>Got it</Button>
        </div>
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;
  return createPortal(content, document.body);
}
