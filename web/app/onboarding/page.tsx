"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useOnboardingStore } from "@/lib/onboarding";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

export default function OnboardingPage() {
  const fetchOnboarding = useOnboardingStore((s) => s.fetchOnboarding);
  const isLoading = useOnboardingStore((s) => s.isLoading);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void fetchOnboarding().then(() => setReady(true));
  }, [fetchOnboarding]);

  if (!ready || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand-500" />
          <p className="mt-4 text-sm text-brand-600">
            Preparing your workspace...
          </p>
        </div>
      </div>
    );
  }

  return <OnboardingShell />;
}
