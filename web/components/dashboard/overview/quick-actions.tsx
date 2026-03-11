"use client";

import { useRef } from "react";
import type { OverviewAction } from "@/lib/dashboard/company-overview";
import { Card } from "@/components/ui/card";
import {
  Users,
  AlertTriangle,
  BarChart3,
  Shield,
  Upload,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const ICONS = {
  users: Users,
  alert: AlertTriangle,
  chart: BarChart3,
  shield: Shield,
  upload: Upload,
} as const;

const TONE_STYLES = {
  danger: {
    card: "border-rose-200 bg-rose-50/60 hover:bg-rose-50",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    count: "text-rose-700 bg-white",
  },
  warning: {
    card: "border-amber-200 bg-amber-50/60 hover:bg-amber-50",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    count: "text-amber-700 bg-white",
  },
  info: {
    card: "border-brand-200 bg-brand-50/70 hover:bg-brand-50",
    iconBg: "bg-brand-100",
    iconColor: "text-brand-600",
    count: "text-brand-700 bg-white",
  },
  positive: {
    card: "border-emerald-200 bg-emerald-50/70 hover:bg-emerald-50",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    count: "text-emerald-700 bg-white",
  },
} as const;

interface QuickActionsProps {
  actions: OverviewAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
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
        {actions.map((action) => {
          const Icon = ICONS[action.icon];
          const tone = TONE_STYLES[action.tone];

          return (
            <Link key={action.id} href={action.href} className="shrink-0 w-[260px]">
              <Card
                className={clsx(
                  "dash-card flex h-full flex-col border p-5 transition-shadow hover:shadow-md",
                  tone.card,
                )}
              >
                <div className={clsx("mb-3 flex h-10 w-10 items-center justify-center rounded-xl", tone.iconBg)}>
                  <Icon className={clsx("h-5 w-5", tone.iconColor)} />
                </div>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-accent-900 leading-snug">
                    {action.title}
                  </p>
                  {action.countLabel && (
                    <span className={clsx("rounded-full px-2 py-0.5 text-[10px] font-semibold", tone.count)}>
                      {action.countLabel}
                    </span>
                  )}
                </div>
                <p className="mb-4 flex-1 text-xs text-accent-600">
                  {action.description}
                </p>
                <div className="flex items-center gap-1 text-xs font-semibold text-accent-700 group">
                  {action.actionLabel}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
