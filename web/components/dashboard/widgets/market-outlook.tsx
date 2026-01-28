"use client";

import { CategoryBar, ProgressBar } from "@tremor/react";
import { Briefcase, TrendingUp, Users, Zap } from "lucide-react";
import { MARKET_OUTLOOK } from "@/lib/dashboard/dummy-data";

export function MarketOutlookWidget() {
  return (
    <div className="flex h-full flex-col gap-6">
      {/* Market Sentiment */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-brand-500" />
            <span className="text-sm font-semibold text-brand-900">Market Sentiment</span>
          </div>
          <span className="text-xs font-medium text-brand-600">Employer-driven</span>
        </div>
        <CategoryBar
          values={[40, 20, 40]}
          colors={["emerald", "amber", "rose"]}
          markerValue={MARKET_OUTLOOK.sentiment}
          className="h-2.5"
        />
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-brand-400">
          <span>Candidate Driven</span>
          <span>Balanced</span>
          <span>Employer Driven</span>
        </div>
      </div>

      {/* Hiring Velocity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-brand-900">Hiring Velocity</span>
          </div>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-600">
            {MARKET_OUTLOOK.hiringVelocity}
          </span>
        </div>
        <ProgressBar value={MARKET_OUTLOOK.velocityValue} color="amber" className="h-2" />
      </div>

      {/* Top Skills in Demand */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-brand-500" />
          <span className="text-sm font-semibold text-brand-900">Top Skills in Demand</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {MARKET_OUTLOOK.topSkillsDemand.map((skill) => (
            <span
              key={skill}
              className="rounded-lg border border-brand-100 bg-white px-2.5 py-1 text-xs font-medium text-brand-700 shadow-sm transition-colors hover:bg-brand-50"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="mt-auto rounded-xl bg-brand-50 p-4 border border-brand-100/50">
        <div className="flex items-start gap-3">
          <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <p className="text-xs leading-relaxed text-brand-700 font-medium">
            {MARKET_OUTLOOK.summary}
          </p>
        </div>
      </div>
    </div>
  );
}
