"use client";

import clsx from "clsx";
import { Download, Eye, GitCompare, Save, Search } from "lucide-react";
import {
  formatTimeAgo,
  getLevel,
  getLocation,
  getRole,
  SAMPLE_ACTIVITY,
  type SearchActivity,
} from "@/lib/dashboard/dummy-data";

const ACTION_ICONS = {
  search: Search,
  export: Download,
  compare: GitCompare,
  save: Save,
};

const ACTION_LABELS = {
  search: "searched for",
  export: "exported data for",
  compare: "compared roles for",
  save: "saved to watchlist",
};

const ACTION_COLORS = {
  search: "bg-brand-100 text-brand-600",
  export: "bg-emerald-100 text-emerald-600",
  compare: "bg-amber-100 text-amber-600",
  save: "bg-rose-100 text-rose-600",
};

function ActivityItem({ activity }: { activity: SearchActivity }) {
  const role = getRole(activity.roleId);
  const location = getLocation(activity.locationId);
  const level = getLevel(activity.levelId);
  const Icon = ACTION_ICONS[activity.action];

  return (
    <div className="group flex gap-3 rounded-xl p-3 transition-colors hover:bg-brand-50/50">
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-900 text-sm font-bold text-white">
          {activity.userAvatar}
        </div>
        <div
          className={clsx(
            "absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white",
            ACTION_COLORS[activity.action]
          )}
        >
          <Icon className="h-2.5 w-2.5" />
        </div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-semibold text-brand-900">{activity.userName}</span>
          <span className="text-brand-600"> {ACTION_LABELS[activity.action]} </span>
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
            {role?.title}
          </span>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
            {location?.city}
          </span>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
            {level?.name}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-brand-500">
          {formatTimeAgo(activity.timestamp)}
        </p>
      </div>

      {/* Quick action */}
      <button
        type="button"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-brand-400 opacity-0 transition-all hover:bg-brand-100 hover:text-brand-600 group-hover:opacity-100"
        aria-label="View search"
      >
        <Eye className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ActivityFeedWidget() {
  // Group activities by date
  const today = new Date().toDateString();
  const todayActivities = SAMPLE_ACTIVITY.filter(
    a => new Date(a.timestamp).toDateString() === today
  );
  const olderActivities = SAMPLE_ACTIVITY.filter(
    a => new Date(a.timestamp).toDateString() !== today
  );

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Header stats */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-brand-600">
          <strong>{SAMPLE_ACTIVITY.length}</strong> team activities today
        </p>
        <div className="flex -space-x-2">
          {["SC", "AA", "MS", "JM"].map((initials, i) => (
            <div
              key={initials}
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-brand-800 text-[10px] font-bold text-white"
              style={{ zIndex: 4 - i }}
            >
              {initials}
            </div>
          ))}
        </div>
      </div>

      {/* Activity list */}
      <div className="flex-1 space-y-1 overflow-auto">
        {/* Today section */}
        {todayActivities.length > 0 && (
          <>
            <div className="sticky top-0 z-10 bg-white/80 px-1 py-1.5 backdrop-blur-sm">
              <span className="text-xs font-semibold uppercase text-brand-500">
                Today
              </span>
            </div>
            {todayActivities.map(activity => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </>
        )}

        {/* Earlier section */}
        {olderActivities.length > 0 && (
          <>
            <div className="sticky top-0 z-10 mt-2 bg-white/80 px-1 py-1.5 backdrop-blur-sm">
              <span className="text-xs font-semibold uppercase text-brand-500">
                Earlier
              </span>
            </div>
            {olderActivities.map(activity => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border/30 pt-2 text-center">
        <button
          type="button"
          className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-800"
        >
          View full activity log →
        </button>
      </div>
    </div>
  );
}

