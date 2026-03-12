"use client";

import { NoDataWidget } from "./no-data-widget";

export function SalaryDistributionWidget() {
  return (
    <NoDataWidget
      title="Salary Distribution"
      description="Distribution views are disabled until canonical pooled benchmark distributions are available."
    />
  );
}

