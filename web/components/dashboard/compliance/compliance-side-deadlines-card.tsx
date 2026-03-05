"use client";

import { type DeadlineItem } from "@/lib/compliance/data";
import { useComplianceContext } from "@/lib/compliance/context";
import clsx from "clsx";

type Props = {
  onItemClick: (item: DeadlineItem) => void;
  onViewAll: () => void;
};

export function ComplianceSideDeadlines({ onItemClick, onViewAll }: Props) {
  const { deadlineItems } = useComplianceContext();
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <h4 className="text-sm font-bold text-brand-900">Upcoming Deadlines</h4>

      <div className="mt-4 space-y-3">
        {deadlineItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onItemClick(item)}
            className="flex w-full items-center gap-3 rounded-lg border border-border p-2.5 text-left transition-colors hover:bg-brand-50/50"
          >
            <div className="flex flex-col items-center justify-center rounded-lg bg-brand-50 px-2.5 py-1.5 text-brand-600">
              <span className="text-[10px] font-bold uppercase">
                {item.date.split(" ")[0]}
              </span>
              <span className="text-xs font-bold leading-none">
                {item.date.split(" ")[1]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-brand-900 truncate">
                {item.title}
              </p>
              <p
                className={clsx(
                  "text-[10px] font-semibold uppercase tracking-tight",
                  item.type === "Urgent" && "text-red-500",
                  item.type === "Mandatory" && "text-amber-600",
                  item.type === "Regular" && "text-accent-400"
                )}
              >
                {item.type}
              </p>
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onViewAll}
        className="mt-4 flex h-10 w-full items-center justify-center rounded-xl bg-brand-500 text-xs font-bold text-white transition-colors hover:bg-brand-600"
      >
        View All
      </button>
    </div>
  );
}
