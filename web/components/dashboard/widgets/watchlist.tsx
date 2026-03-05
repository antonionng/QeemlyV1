"use client";

import { NoDataWidget } from "./no-data-widget";

export function WatchlistWidget() {
  return (
    <NoDataWidget
      title="Watchlist"
      description="Saved watchlist analytics are disabled until live tracking data is available."
    />
  );
}
