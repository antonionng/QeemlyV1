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
    <div className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-accent-800">Shortcuts</h2>
        <p className="text-xs text-accent-500">{getOverviewShortcutGuidance()}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {OVERVIEW_SHORTCUTS.map((item) => {
          const Icon = ICON_BY_ID[item.icon];
          return (
          <Link key={item.href} href={item.href}>
            <Card className="dash-card flex h-full items-center gap-4 p-4 transition-colors hover:border-accent-300 hover:shadow-md">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-accent-900">{item.title}</p>
                <p className="text-xs text-accent-500 mt-0.5">{item.description}</p>
              </div>
              <Icon className="h-4 w-4 shrink-0 text-accent-400" />
              <ChevronRight className="h-4 w-4 shrink-0 text-accent-400" />
            </Card>
          </Link>
          );
        })}
      </div>
    </div>
  );
}
