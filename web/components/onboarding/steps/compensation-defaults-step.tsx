"use client";

import { useState, useEffect, useCallback } from "react";
import { Target, Loader2, AlertCircle } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  TARGET_PERCENTILES,
  CURRENCIES,
  REVIEW_CYCLES,
  type TargetPercentile,
  type ReviewCycle,
} from "@/lib/company";
import { useOnboardingStore } from "@/lib/onboarding";

const selectClasses =
  "w-full h-12 rounded-xl border border-border bg-white px-4 text-sm text-brand-900 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100 transition-colors";

export function CompensationDefaultsStep({ onNext }: { onNext: () => void }) {
  const completeStep = useOnboardingStore((s) => s.completeStep);

  const [targetPercentile, setTargetPercentile] = useState<TargetPercentile>(50);
  const [defaultCurrency, setDefaultCurrency] = useState("AED");
  const [reviewCycle, setReviewCycle] = useState<ReviewCycle>("annual");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to load settings");
      const data = await res.json();
      const s = data.settings;
      setTargetPercentile((s.target_percentile as TargetPercentile) || 50);
      setDefaultCurrency(s.default_currency || "AED");
      setReviewCycle((s.review_cycle as ReviewCycle) || "annual");
    } catch {
      setError("Could not load existing settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleContinue = async () => {
    try {
      setSaving(true);
      setError(null);

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_percentile: targetPercentile,
          default_currency: defaultCurrency,
          review_cycle: reviewCycle,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Failed to save");
      }

      await completeStep("compensation_defaults");
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save defaults.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
          <Target className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-brand-900">
            Compensation defaults
          </h2>
          <p className="text-sm text-brand-500">
            Choose how Qeemly positions your pay against the market.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Target percentile cards */}
      <Card className="space-y-6 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-brand-700">
            Target percentile
          </label>
          <p className="mb-4 text-xs text-brand-500">
            This is the default percentile used for salary benchmarks. You can
            override it per search.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TARGET_PERCENTILES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTargetPercentile(opt.value)}
                className={clsx(
                  "rounded-xl p-4 text-center transition-all",
                  targetPercentile === opt.value
                    ? "bg-brand-500 text-white ring-2 ring-brand-500 ring-offset-2"
                    : "bg-brand-50 text-brand-700 hover:bg-brand-100",
                )}
              >
                <div className="text-xl font-bold">{opt.value}th</div>
                <div
                  className={clsx(
                    "mt-1 text-xs",
                    targetPercentile === opt.value
                      ? "text-brand-100"
                      : "text-brand-500",
                  )}
                >
                  {opt.value === 25
                    ? "Below Market"
                    : opt.value === 50
                      ? "Median"
                      : opt.value === 75
                        ? "Above Market"
                        : "Premium"}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Currency & Review cycle */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-700">
              Default currency
            </label>
            <select
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value)}
              className={selectClasses}
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-700">
              Review cycle
            </label>
            <select
              value={reviewCycle}
              onChange={(e) => setReviewCycle(e.target.value as ReviewCycle)}
              className={selectClasses}
            >
              {REVIEW_CYCLES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Continue */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleContinue} isLoading={saving} className="px-8">
          Save & Continue
        </Button>
      </div>
    </div>
  );
}
