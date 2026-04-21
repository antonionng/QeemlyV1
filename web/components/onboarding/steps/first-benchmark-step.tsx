"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useOnboardingStore } from "@/lib/onboarding";

export function FirstBenchmarkStep() {
  const router = useRouter();
  const completeStep = useOnboardingStore((s) => s.completeStep);
  const [loading, setLoading] = useState(false);

  const handleLaunch = async () => {
    try {
      setLoading(true);
      await completeStep("first_benchmark");
      await completeStep("completed");
      router.push("/dashboard/benchmarks");
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-brand-900">
            Run your first benchmark
          </h2>
          <p className="text-sm text-brand-500">
            See how salaries compare to market data in seconds.
          </p>
        </div>
      </div>

      {/* CTA card */}
      <Card className="p-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-brand-500 shadow-lg shadow-brand-200">
          <BarChart3 className="h-8 w-8 text-white" />
        </div>

        <h3 className="text-xl font-bold text-brand-900">
          You&apos;re ready to run your first benchmark
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-brand-600 leading-relaxed">
          Your workspace is configured. Let&apos;s see Qeemly in action. Search
          for any role and location to get instant salary data from the market.
        </p>

        <div className="mt-8">
          <Button
            size="lg"
            onClick={handleLaunch}
            isLoading={loading}
            className="px-10"
          >
            Run your first benchmark
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
