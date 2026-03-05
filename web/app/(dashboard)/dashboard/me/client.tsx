"use client";

import {
  TotalCompCard,
  CompBreakdown,
  BandPosition,
  RoleDetailsCard,
  GrowthChart,
} from "@/components/employee";
import type { EmployeeDashboardData } from "@/lib/employee";

interface MyCompensationClientProps {
  data: EmployeeDashboardData;
}

export function MyCompensationClient({ data }: MyCompensationClientProps) {
  const { profile, totalComp, band, history, reviewCycle, nextReviewDate, companyName, userName } =
    data;

  const firstName = userName.split(" ")[0];

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-accent-800">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-[15px] text-brand-600/80">
          Here&apos;s your compensation overview at {companyName}.
        </p>
      </div>

      {/* Top row: Total Comp + Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TotalCompCard
          baseSalary={profile.baseSalary}
          bonus={profile.bonus}
          equity={profile.equity}
          currency={profile.currency}
        />
        <CompBreakdown
          baseSalary={profile.baseSalary}
          bonus={profile.bonus}
          equity={profile.equity}
          currency={profile.currency}
        />
      </div>

      {/* Band position */}
      {band && (
        <BandPosition
          band={band}
          baseSalary={profile.baseSalary}
          currency={profile.currency}
        />
      )}

      {/* Growth chart */}
      {history.length > 0 && (
        <GrowthChart
          history={history}
          currentSalary={profile.baseSalary}
          currency={profile.currency}
        />
      )}

      {/* Role details */}
      <RoleDetailsCard
        profile={profile}
        nextReviewDate={nextReviewDate}
        reviewCycle={reviewCycle}
      />
    </div>
  );
}
