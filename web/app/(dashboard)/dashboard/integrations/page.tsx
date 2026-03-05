"use client";

import { IntegrationsPage } from "@/components/dashboard/integrations/integrations-page";
import { FeatureNotEnabled } from "@/components/dashboard/feature-not-enabled";
import { isFeatureEnabled } from "@/lib/release/ga-scope";

export default function IntegrationsRoute() {
  if (!isFeatureEnabled("integrations")) {
    return <FeatureNotEnabled featureName="Integrations" />;
  }

  return <IntegrationsPage />;
}
