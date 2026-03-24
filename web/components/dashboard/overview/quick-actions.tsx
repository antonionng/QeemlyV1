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
    card: "border-[rgba(255,32,86,0.2)] bg-[rgba(255,32,86,0.08)] hover:bg-[rgba(255,32,86,0.12)]",
    iconBg: "bg-[rgba(255,32,86,0.14)]",
    iconColor: "text-[#FF2056]",
    count: "bg-white text-[#FF2056]",
  },
  warning: {
    card: "border-[rgba(254,154,0,0.2)] bg-[rgba(254,154,0,0.08)] hover:bg-[rgba(254,154,0,0.12)]",
    iconBg: "bg-[rgba(254,154,0,0.14)]",
    iconColor: "text-[#FE9A00]",
    count: "bg-white text-[#FE9A00]",
  },
  info: {
    card: "border-[rgba(92,69,253,0.2)] bg-[rgba(92,69,253,0.08)] hover:bg-[rgba(92,69,253,0.12)]",
    iconBg: "bg-[rgba(92,69,253,0.14)]",
    iconColor: "text-[#5C45FD]",
    count: "bg-white text-[#5C45FD]",
  },
  positive: {
    card: "border-[rgba(0,188,125,0.2)] bg-[rgba(0,188,125,0.08)] hover:bg-[rgba(0,188,125,0.12)]",
    iconBg: "bg-[rgba(0,188,125,0.14)]",
    iconColor: "text-[#00BC7D]",
    count: "bg-white text-[#00BC7D]",
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
    <section className="overview-section">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="overview-section-title">Quick Actions</h2>
          <p className="overview-supporting-text mt-1">Prioritized actions and issues that need attention.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-accent-500 transition-colors hover:bg-accent-50 hover:text-accent-700"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-accent-500 transition-colors hover:bg-accent-50 hover:text-accent-700"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-1 scrollbar-none sm:gap-6"
        style={{ scrollbarWidth: "none" }}
      >
        {actions.map((action) => {
          const Icon = ICONS[action.icon];
          const tone = TONE_STYLES[action.tone];

          return (
            <Link key={action.id} href={action.href} className="w-[240px] max-w-[85vw] shrink-0 sm:w-[260px]">
              <Card
                className={clsx(
                  "flex h-full flex-col border p-6 transition-shadow hover:shadow-md",
                  tone.card,
                )}
              >
                <div className={clsx("mb-4 flex h-10 w-10 items-center justify-center rounded-xl", tone.iconBg)}>
                  <Icon className={clsx("h-5 w-5", tone.iconColor)} strokeWidth={1.5} />
                </div>
                <div className="mb-2 flex min-h-[3rem] items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 break-words text-sm font-medium leading-snug text-[#111233] line-clamp-2">
                    {action.title}
                  </p>
                  {action.countLabel && (
                    <span className={clsx("rounded-full px-2 py-0.5 text-[10px] font-semibold", tone.count)}>
                      {action.countLabel}
                    </span>
                  )}
                </div>
                <p className="mb-6 min-h-[4.5rem] flex-1 text-[13px] text-[#969799] line-clamp-3">
                  {action.description}
                </p>
                <div className="group flex items-center gap-1 text-xs font-semibold text-[#111233]">
                  {action.actionLabel}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
