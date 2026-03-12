"use client";

import { NoDataWidget } from "./no-data-widget";

export function GeoComparisonWidget() {
  return (
    <NoDataWidget
      title="Geo Comparison"
      description="Cross-market comparisons are hidden until pooled data covers multiple GCC locations consistently."
    />
  );
}
