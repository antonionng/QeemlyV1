"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type FeatureNotEnabledProps = {
  featureName: string;
};

export function FeatureNotEnabled({ featureName }: FeatureNotEnabledProps) {
  return (
    <Card className="max-w-3xl border-amber-200 bg-amber-50 p-6">
      <h1 className="text-2xl font-bold text-amber-900">{featureName} is not in GA yet</h1>
      <p className="mt-2 text-sm text-amber-800">
        This workflow is intentionally disabled for the current launch scope so the team can focus
        on core compensation workflows first.
      </p>
      <div className="mt-4">
        <Link href="/dashboard/overview">
          <Button size="sm">Return to Overview</Button>
        </Link>
      </div>
    </Card>
  );
}
