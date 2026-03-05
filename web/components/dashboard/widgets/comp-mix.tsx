"use client";

import { NoDataWidget } from "./no-data-widget";

export function CompMixWidget() {
  return (
    <NoDataWidget
      title="Compensation Mix"
      description="Component-level compensation splits are not available for this workspace."
    />
  );
}
