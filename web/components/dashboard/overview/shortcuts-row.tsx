"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  getOverviewShortcutGuidance,
  OVERVIEW_SHORTCUTS,
} from "@/lib/dashboard/overview-shortcuts";

export function ShortcutsRow() {
  return (
    <section className="overview-section">
      <div className="space-y-1">
        <h2 className="overview-section-title">Shortcuts</h2>
        <p className="overview-supporting-text">{getOverviewShortcutGuidance()}</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
        {OVERVIEW_SHORTCUTS.map((item) => {
          return (
            <Link key={item.href} href={item.href}>
              <Card className="flex h-full min-h-[96px] flex-row items-center justify-between gap-6 rounded-[16px] border-[#E5E7EB] p-5 transition-all hover:shadow-md">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-semibold leading-tight text-[#111233]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[12px] leading-5 text-[#6B7280]">{item.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-[#111233]" strokeWidth={1.7} />
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
