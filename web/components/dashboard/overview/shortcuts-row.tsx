"use client";

import Link from "next/link";
import { ChevronRight, PlayCircle, Users, Download, BarChart3, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  getOverviewShortcutGuidance,
  OVERVIEW_SHORTCUTS,
  type OverviewShortcutIcon,
} from "@/lib/dashboard/overview-shortcuts";

const ICON_BY_ID: Record<OverviewShortcutIcon, typeof PlayCircle> = {
  play: PlayCircle,
  users: Users,
  download: Download,
  chart: BarChart3,
  upload: Upload,
};

export function ShortcutsRow() {
  return (
    <section className="overview-section">
      <div className="space-y-1">
        <h2 className="overview-section-title">Shortcuts</h2>
        <p className="overview-supporting-text">{getOverviewShortcutGuidance()}</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
        {OVERVIEW_SHORTCUTS.map((item) => {
          const Icon = ICON_BY_ID[item.icon];
          return (
          <Link key={item.href} href={item.href}>
            <Card className="flex h-full min-h-[140px] flex-col gap-4 rounded-[14px] p-5 transition-all hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-accent-400" strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-accent-900">{item.title}</p>
                <p className="overview-supporting-text mt-2">{item.description}</p>
              </div>
            </Card>
          </Link>
          );
        })}
      </div>
    </section>
  );
}
