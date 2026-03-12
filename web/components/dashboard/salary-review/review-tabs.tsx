"use client";

import type { SalaryReviewTab } from "@/lib/salary-review/url-state";

export type ReviewTabItem = {
  id: SalaryReviewTab;
  label: string;
  badge?: number;
};

type ReviewTabsProps = {
  activeTab: SalaryReviewTab;
  items: ReviewTabItem[];
  onChange: (tab: SalaryReviewTab) => void;
};

export function ReviewTabs({
  activeTab,
  items,
  onChange,
}: ReviewTabsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent-100 bg-white px-3 py-2">
      <div className="inline-flex flex-wrap rounded-2xl border border-accent-100 bg-accent-50/70 p-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === item.id
                ? "bg-brand-500 text-white shadow-sm"
                : "text-accent-600 hover:bg-accent-50"
            }`}
          >
            <span>{item.label}</span>
            {typeof item.badge === "number" ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  activeTab === item.id ? "bg-white/20 text-white" : "bg-white text-accent-600"
                }`}
              >
                {item.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
