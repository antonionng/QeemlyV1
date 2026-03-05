"use client";

import { Card } from "@/components/ui/card";
import { User, Mail, Briefcase, MapPin, Calendar, Shield } from "lucide-react";
import type { EmployeeDashboardData } from "@/lib/employee";

interface ProfileClientProps {
  data: EmployeeDashboardData;
}

export function ProfileClient({ data }: ProfileClientProps) {
  const { profile, companyName, userName } = data;

  const infoSections = [
    {
      title: "Personal Information",
      items: [
        { icon: User, label: "Full Name", value: `${profile.firstName} ${profile.lastName}` },
        { icon: Mail, label: "Email", value: profile.email || "Not provided" },
      ],
    },
    {
      title: "Role Information",
      items: [
        { icon: Briefcase, label: "Department", value: profile.department },
        { icon: Briefcase, label: "Role", value: profile.roleId },
        { icon: Shield, label: "Level", value: profile.levelId },
        { icon: MapPin, label: "Location", value: profile.locationId },
        {
          icon: Briefcase,
          label: "Employment Type",
          value: profile.employmentType === "expat" ? "Expatriate" : "National",
        },
      ],
    },
    {
      title: "Dates",
      items: [
        {
          icon: Calendar,
          label: "Hire Date",
          value: profile.hireDate
            ? new Date(profile.hireDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })
            : "Not recorded",
        },
        {
          icon: Calendar,
          label: "Last Review",
          value: profile.lastReviewDate
            ? new Date(profile.lastReviewDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })
            : "Not recorded",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-accent-800">
          My Profile
        </h1>
        <p className="mt-1 text-[15px] text-brand-600/80">
          Your details at {companyName}.
        </p>
      </div>

      {/* Avatar + name card */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-900 text-white text-2xl font-bold">
            {profile.firstName.charAt(0)}
            {profile.lastName.charAt(0)}
          </div>
          <div>
            <p className="text-xl font-bold text-brand-900">
              {profile.firstName} {profile.lastName}
            </p>
            <p className="text-sm text-brand-600">
              {profile.roleId} &middot; {profile.department}
            </p>
            <p className="text-xs text-brand-500 mt-0.5">
              {profile.status === "active" ? "Active" : "Inactive"} &middot; {companyName}
            </p>
          </div>
        </div>
      </Card>

      {/* Info sections */}
      {infoSections.map((section) => (
        <Card key={section.title} className="p-6">
          <h3 className="text-sm font-semibold text-brand-700 mb-4">{section.title}</h3>
          <div className="space-y-4">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                    <Icon className="h-4 w-4 text-brand-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-brand-500">{item.label}</p>
                    <p className="text-sm font-semibold text-brand-900">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
