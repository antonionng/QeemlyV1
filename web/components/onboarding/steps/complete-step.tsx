"use client";

import Link from "next/link";
import {
  CheckCircle,
  LayoutDashboard,
  Upload,
  Users,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const NEXT_ACTIONS = [
  {
    icon: LayoutDashboard,
    title: "Explore the Dashboard",
    description: "See market insights, trends, and your compensation overview.",
    href: "/dashboard",
    color: "bg-brand-50 text-brand-500",
  },
  {
    icon: Upload,
    title: "Upload Employee Data",
    description:
      "Import your roster to see where each role sits against the market.",
    href: "/dashboard/upload",
    color: "bg-amber-50 text-amber-500",
  },
  {
    icon: Users,
    title: "Invite Your Team",
    description:
      "Add team members so they can access benchmarks and reports.",
    href: "/dashboard/team",
    color: "bg-emerald-50 text-emerald-500",
  },
];

export function CompleteStep() {
  return (
    <div className="text-center">
      {/* Success icon */}
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle className="h-10 w-10 text-emerald-500" />
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-brand-900">
        You&apos;re all set!
      </h1>
      <p className="mx-auto mt-3 max-w-md text-base text-brand-600 leading-relaxed">
        Your workspace is configured and ready to go. Here are some things you
        can do next.
      </p>

      {/* Next action cards */}
      <div className="mt-10 grid gap-3 text-left">
        {NEXT_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href} className="block">
              <Card
                clickable
                className="flex items-center gap-4 p-5 transition-shadow hover:shadow-md"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${action.color}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-brand-900">
                    {action.title}
                  </p>
                  <p className="mt-0.5 text-xs text-brand-500">
                    {action.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-brand-400" />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
