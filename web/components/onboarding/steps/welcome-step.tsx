"use client";

import {
  Sparkles,
  Building2,
  Target,
  Upload,
  BarChart3,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const STEPS_PREVIEW = [
  {
    icon: Building2,
    title: "Company profile",
    description: "Tell us about your company and industry.",
    minutes: 3,
  },
  {
    icon: Target,
    title: "Compensation defaults",
    description: "Set your target percentile, currency, and review cycle.",
    minutes: 2,
  },
  {
    icon: Upload,
    title: "Upload employee data",
    description: "Import your roster to see where each role sits. Optional.",
    minutes: 5,
  },
  {
    icon: BarChart3,
    title: "First benchmark",
    description: "Run your first salary comparison against the market.",
    minutes: 3,
  },
];

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  const totalMinutes = STEPS_PREVIEW.reduce((sum, s) => sum + s.minutes, 0);

  return (
    <div className="text-center">
      {/* Hero */}
      <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-200">
        <Sparkles className="h-8 w-8 text-white" />
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-brand-900">
        Welcome to Qeemly
      </h1>
      <p className="mx-auto mt-3 max-w-md text-base text-brand-600 leading-relaxed">
        Let&apos;s set up your workspace in about {totalMinutes} minutes. You
        will configure your company profile, set compensation defaults, and
        optionally upload employee data.
      </p>

      {/* Time estimate badge */}
      <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700">
        <Clock className="h-4 w-4" />
        About {totalMinutes} minutes total
      </div>

      {/* Steps preview */}
      <div className="mt-10 grid gap-3 text-left">
        {STEPS_PREVIEW.map((step) => {
          const Icon = step.icon;
          return (
            <Card key={step.title} className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-brand-900">
                  {step.title}
                </p>
                <p className="text-xs text-brand-500">{step.description}</p>
              </div>
              <span className="shrink-0 text-xs text-brand-400">
                ~{step.minutes} min
              </span>
            </Card>
          );
        })}
      </div>

      {/* CTA */}
      <div className="mt-10">
        <Button size="lg" onClick={onNext} className="px-10">
          Get Started
          <Sparkles className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
