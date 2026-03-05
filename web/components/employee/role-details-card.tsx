"use client";

import { Card } from "@/components/ui/card";
import { Briefcase, MapPin, Calendar, Star } from "lucide-react";
import type { EmployeeProfile } from "@/lib/employee";

interface RoleDetailsCardProps {
  profile: EmployeeProfile;
  nextReviewDate: string | null;
  reviewCycle: string;
}

const PERFORMANCE_LABELS: Record<string, { label: string; color: string }> = {
  exceptional: { label: "Exceptional", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  exceeds: { label: "Exceeds Expectations", color: "bg-blue-100 text-blue-700 border-blue-200" },
  meets: { label: "Meets Expectations", color: "bg-brand-100 text-brand-700 border-brand-200" },
  low: { label: "Developing", color: "bg-amber-100 text-amber-700 border-amber-200" },
};

export function RoleDetailsCard({ profile, nextReviewDate, reviewCycle }: RoleDetailsCardProps) {
  const perf = profile.performanceRating
    ? PERFORMANCE_LABELS[profile.performanceRating]
    : null;

  const details = [
    { icon: Briefcase, label: "Department", value: profile.department },
    { icon: Briefcase, label: "Role", value: profile.roleId },
    { icon: Briefcase, label: "Level", value: profile.levelId },
    { icon: MapPin, label: "Location", value: profile.locationId },
    {
      icon: Calendar,
      label: "Hire Date",
      value: profile.hireDate
        ? new Date(profile.hireDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : "N/A",
    },
    {
      icon: Calendar,
      label: "Next Review",
      value: nextReviewDate
        ? new Date(nextReviewDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : `${reviewCycle.charAt(0).toUpperCase() + reviewCycle.slice(1)} cycle`,
    },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-brand-700">Role Details</h3>
        {perf && (
          <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${perf.color}`}>
            <Star className="h-3 w-3" />
            {perf.label}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {details.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                <Icon className="h-3.5 w-3.5 text-brand-500" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-brand-500 uppercase tracking-wide">
                  {item.label}
                </p>
                <p className="text-sm font-semibold text-brand-900">{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
