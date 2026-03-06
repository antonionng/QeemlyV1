"use client";

import Link from "next/link";
import { ChevronRight, PlayCircle, Users, Download, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";

const shortcuts = [
  {
    title: "Run Salary Review",
    description: "Start new compensation review cycle",
    href: "/dashboard/salary-review",
    icon: PlayCircle,
  },
  {
    title: "View Outside Band",
    description: "Employees requiring attention",
    href: "/dashboard/salary-review?filter=outside-band",
    icon: Users,
  },
  {
    title: "Export Report",
    description: "Download compensation summary",
    href: "/dashboard/reports",
    icon: Download,
  },
  {
    title: "Explore Benchmarks",
    description: "Qeemly market comparison data",
    href: "/dashboard/benchmarks",
    icon: BarChart3,
  },
];

export function ShortcutsRow() {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-accent-800">Shortcuts</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {shortcuts.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="dash-card flex h-full items-center gap-4 p-4 transition-colors hover:border-accent-300 hover:shadow-md">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-accent-900">{item.title}</p>
                <p className="text-xs text-accent-500 mt-0.5">{item.description}</p>
              </div>
              <item.icon className="h-4 w-4 shrink-0 text-accent-400" />
              <ChevronRight className="h-4 w-4 shrink-0 text-accent-400" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
