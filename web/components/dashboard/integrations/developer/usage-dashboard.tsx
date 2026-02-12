"use client";

import clsx from "clsx";
import { BarChart3, Clock, Zap, AlertTriangle } from "lucide-react";
import { useIntegrationsStore } from "@/lib/integrations/store";

// Mock usage data for UI display
const MOCK_DAILY_USAGE = [
  { day: "Mon", requests: 124 },
  { day: "Tue", requests: 256 },
  { day: "Wed", requests: 189 },
  { day: "Thu", requests: 312 },
  { day: "Fri", requests: 278 },
  { day: "Sat", requests: 45 },
  { day: "Sun", requests: 23 },
];

const PLAN_LIMITS = {
  requestsPerDay: 10000,
  requestsPerMonth: 250000,
  webhooksPerWorkspace: 10,
  apiKeysPerWorkspace: 20,
};

export function UsageDashboard() {
  const store = useIntegrationsStore();

  // Calculate stats from store (mock for now)
  const totalApiKeys = store.apiKeys.filter((k) => !k.revoked_at).length;
  const totalWebhooks = store.webhooks.filter((w) => w.enabled).length;
  const todayRequests = MOCK_DAILY_USAGE[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]?.requests ?? 0;
  const weekRequests = MOCK_DAILY_USAGE.reduce((sum, d) => sum + d.requests, 0);
  const maxDailyUsage = Math.max(...MOCK_DAILY_USAGE.map((d) => d.requests));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-brand-900">Usage &amp; Rate Limits</h3>
        <p className="mt-0.5 text-xs text-brand-500">
          Monitor your API usage and current plan limits.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Today"
          value={todayRequests.toLocaleString()}
          sublabel={`of ${PLAN_LIMITS.requestsPerDay.toLocaleString()}/day`}
          percentage={(todayRequests / PLAN_LIMITS.requestsPerDay) * 100}
          icon={<Zap className="h-4 w-4" />}
        />
        <StatCard
          label="This Week"
          value={weekRequests.toLocaleString()}
          sublabel="requests"
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <StatCard
          label="API Keys"
          value={`${totalApiKeys}`}
          sublabel={`of ${PLAN_LIMITS.apiKeysPerWorkspace} max`}
          percentage={(totalApiKeys / PLAN_LIMITS.apiKeysPerWorkspace) * 100}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          label="Webhooks"
          value={`${totalWebhooks}`}
          sublabel={`of ${PLAN_LIMITS.webhooksPerWorkspace} max`}
          percentage={(totalWebhooks / PLAN_LIMITS.webhooksPerWorkspace) * 100}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      {/* Daily Usage Chart (simple bar chart) */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-500">
          Daily Requests (Last 7 Days)
        </h4>
        <div className="flex items-end gap-2 h-32 rounded-xl bg-brand-50/50 border border-border px-4 py-3">
          {MOCK_DAILY_USAGE.map((day, idx) => {
            const heightPercent = maxDailyUsage > 0 ? (day.requests / maxDailyUsage) * 100 : 0;
            const isToday = idx === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
            return (
              <div key={day.day} className="flex flex-1 flex-col items-center gap-1">
                <div className="relative w-full flex items-end justify-center" style={{ height: "80px" }}>
                  <div
                    className={clsx(
                      "w-full max-w-[32px] rounded-t-md transition-all",
                      isToday ? "bg-brand-500" : "bg-brand-200"
                    )}
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                  />
                </div>
                <span className={clsx(
                  "text-[10px] font-medium",
                  isToday ? "text-brand-900" : "text-brand-400"
                )}>
                  {day.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rate Limits Table */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-500">
          Plan Limits
        </h4>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-brand-50">
              <tr>
                <th className="text-left py-2.5 px-4 font-semibold text-brand-700">Resource</th>
                <th className="text-right py-2.5 px-4 font-semibold text-brand-700">Limit</th>
                <th className="text-right py-2.5 px-4 font-semibold text-brand-700">Current</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-2.5 px-4 text-brand-800">Requests / day</td>
                <td className="py-2.5 px-4 text-right text-brand-600">{PLAN_LIMITS.requestsPerDay.toLocaleString()}</td>
                <td className="py-2.5 px-4 text-right font-medium text-brand-900">{todayRequests.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-brand-800">Requests / month</td>
                <td className="py-2.5 px-4 text-right text-brand-600">{PLAN_LIMITS.requestsPerMonth.toLocaleString()}</td>
                <td className="py-2.5 px-4 text-right font-medium text-brand-900">{weekRequests.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-brand-800">API Keys</td>
                <td className="py-2.5 px-4 text-right text-brand-600">{PLAN_LIMITS.apiKeysPerWorkspace}</td>
                <td className="py-2.5 px-4 text-right font-medium text-brand-900">{totalApiKeys}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-brand-800">Webhooks</td>
                <td className="py-2.5 px-4 text-right text-brand-600">{PLAN_LIMITS.webhooksPerWorkspace}</td>
                <td className="py-2.5 px-4 text-right font-medium text-brand-900">{totalWebhooks}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-brand-800">Rate limit per request</td>
                <td className="py-2.5 px-4 text-right text-brand-600">100 req/min</td>
                <td className="py-2.5 px-4 text-right font-medium text-brand-900">--</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Stat Card
// ============================================================================

function StatCard({
  label,
  value,
  sublabel,
  percentage,
  icon,
}: {
  label: string;
  value: string;
  sublabel: string;
  percentage?: number;
  icon: React.ReactNode;
}) {
  const isWarning = percentage !== undefined && percentage > 80;
  return (
    <div className="rounded-xl border border-border bg-white p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-400">
          {label}
        </span>
        <span className={clsx("text-brand-300", isWarning && "text-amber-500")}>{icon}</span>
      </div>
      <p className="text-xl font-bold text-brand-900">{value}</p>
      <p className="text-[10px] text-brand-400 mt-0.5">{sublabel}</p>
      {percentage !== undefined && (
        <div className="mt-2 h-1 rounded-full bg-brand-100 overflow-hidden">
          <div
            className={clsx(
              "h-full rounded-full transition-all",
              isWarning ? "bg-amber-500" : "bg-brand-400"
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
