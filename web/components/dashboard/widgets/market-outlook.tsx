"use client";

import { NoDataWidget } from "./no-data-widget";

export function MarketOutlookWidget() {
  return (
    <NoDataWidget
      title="Market Outlook"
      description="Outlook indicators are disabled until live trend feeds are available."
    />
  );
}
