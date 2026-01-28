"use client";

import { Badge } from "@/components/ui/badge";
import { Users, TrendingDown, TrendingUp, Minus, Info } from "lucide-react";

export function PayEquityAuditWidget() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border/50 bg-white/50 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-500">Gender Pay Gap</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-brand-900">2.4%</span>
            <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
              <TrendingDown className="h-3 w-3" />
              0.8%
            </span>
          </div>
          <p className="mt-1 text-[10px] text-brand-500">Favoring Men</p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-white/50 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-500">Equity Score</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-brand-900">94/100</span>
          </div>
          <p className="mt-1 text-[10px] text-brand-500">Industry Avg: 88</p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-white/50 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-500">Audited Roles</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-brand-900">142</span>
          </div>
          <p className="mt-1 text-[10px] text-brand-500">Across 6 Locations</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-brand-900 p-5 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-sm">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div>
              <h5 className="text-[14px] font-bold">Equity distribution</h5>
              <p className="text-[11px] text-brand-200">Statistical parity by level</p>
            </div>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Healthy</Badge>
        </div>

        <div className="mt-6 space-y-4">
          {[
            { level: "Junior (L1-L2)", gap: "0.5%", status: "neutral" },
            { level: "Middle (L3-L4)", gap: "1.2%", status: "up" },
            { level: "Senior (L5-L6)", gap: "3.8%", status: "up" },
            { level: "Executive (L7+)", gap: "5.1%", status: "down" },
          ].map((item) => (
            <div key={item.level} className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-brand-100">{item.level}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{item.gap} gap</span>
                  {item.status === "up" ? (
                    <TrendingUp className="h-3 w-3 text-red-400" />
                  ) : item.status === "down" ? (
                    <TrendingDown className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Minus className="h-3 w-3 text-brand-400" />
                  )}
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div 
                  className="h-full bg-white/40" 
                  style={{ width: `${100 - parseFloat(item.gap) * 10}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-brand-50 p-3 text-brand-700">
        <Info className="h-4 w-4 shrink-0 text-brand-500" />
        <p className="text-[11px] leading-tight">
          Your current pay gap is <span className="font-bold">below the industry median</span> for technology companies in the UAE.
        </p>
      </div>
    </div>
  );
}
