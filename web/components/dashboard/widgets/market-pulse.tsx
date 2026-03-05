"use client";

import { NoDataWidget } from "./no-data-widget";

export function MarketPulseWidget() {
  return (
    <NoDataWidget
      title="Market Pulse"
      description="Live market pulse metrics are unavailable until ingestion completes."
    />
  );
}
