"use client";

import { useRef } from "react";
import { Card } from "@/components/ui/card";
import {
  Users,
  AlertTriangle,
  Flame,
  BarChart3,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface ActionCard {
  label: string;
  description: string;
  icon: typeof Users;
  iconBg: string;
  iconColor: string;
  href: string;
  actionText: string;
  count?: string;
}

const actions: ActionCard[] = [
  {
    label: "56 employees outside compensation band",
    description: "Review & align compensation levels",
    icon: Users,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    href: "/dashboard/salary-review?filter=outside-band",
    actionText: "Review Employees",
    count: "56 emp",
  },
  {
    label: "Medium Importance Action",
    description: "Learn your full/shared and unusual.",
    icon: AlertTriangle,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    href: "/dashboard/salary-review",
    actionText: "Start Action",
  },
  {
    label: "High Importance Action",
    description: "Employees require immediate attention",
    icon: Flame,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    href: "/dashboard/reports",
    actionText: "Start Action",
  },
  {
    label: "Regular Action",
    description: "Learn your full/shared and unusual.",
    icon: BarChart3,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    href: "/dashboard/benchmarks",
    actionText: "Start Action",
  },
];

export function QuickActions() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 280;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-accent-800">Quick Actions or Needs Attention</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="h-7 w-7 rounded-lg border border-border bg-white flex items-center justify-center text-accent-500 hover:text-accent-700 hover:bg-accent-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="h-7 w-7 rounded-lg border border-border bg-white flex items-center justify-center text-accent-500 hover:text-accent-700 hover:bg-accent-50 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-1 scrollbar-none"
        style={{ scrollbarWidth: "none" }}
      >
        {actions.map((action) => (
          <Link key={action.label} href={action.href} className="shrink-0 w-[240px]">
            <Card className="dash-card p-5 h-full flex flex-col hover:shadow-md transition-shadow">
              <div className={`h-10 w-10 rounded-xl ${action.iconBg} flex items-center justify-center mb-3`}>
                <action.icon className={`h-5 w-5 ${action.iconColor}`} />
              </div>
              <p className="text-sm font-semibold text-accent-900 leading-snug mb-1">
                {action.label}
              </p>
              <p className="text-xs text-accent-500 mb-4 flex-1">
                {action.description}
              </p>
              <div className="flex items-center gap-1 text-xs font-semibold text-accent-700 group">
                {action.actionText}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
