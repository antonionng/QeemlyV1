"use client";

import { useEffect, useState } from "react";
import { CreditCard, DollarSign, Users, TrendingUp, FileText } from "lucide-react";

type BillingActivity = {
  id: string;
  type: string;
  occurred_at: string;
  workspace_name: string;
  description: string;
};

type BillingPlan = {
  name: string;
  count: number;
  monthly_revenue: number;
};

type BillingResponse = {
  mrr: number;
  arr: number;
  paid_tenants: number;
  avg_revenue_per_tenant: number;
  plan_breakdown: BillingPlan[];
  recent_activity: BillingActivity[];
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function BillingPage() {
  const [data, setData] = useState<BillingResponse | null>(null);

  useEffect(() => {
    fetch("/api/admin/billing")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => setData(payload))
      .catch(() => setData(null));
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title">Billing</h1>
        <p className="page-subtitle">
          Platform billing and revenue overview
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">MRR</p>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-1 text-2xl font-bold text-text-primary">{formatMoney(data?.mrr ?? 0)}</p>
          <p className="mt-1 text-xs text-text-tertiary">Monthly recurring revenue</p>
        </div>
        <div className="panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">ARR</p>
            <TrendingUp className="h-4 w-4 text-brand-500" />
          </div>
          <p className="mt-1 text-2xl font-bold text-text-primary">{formatMoney(data?.arr ?? 0)}</p>
          <p className="mt-1 text-xs text-text-tertiary">Annual recurring revenue</p>
        </div>
        <div className="panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Paid Tenants</p>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-1 text-2xl font-bold text-text-primary">{data?.paid_tenants ?? 0}</p>
          <p className="mt-1 text-xs text-text-tertiary">Active subscriptions</p>
        </div>
        <div className="panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Avg. Revenue</p>
            <CreditCard className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-1 text-2xl font-bold text-text-primary">
            {formatMoney(data?.avg_revenue_per_tenant ?? 0)}
          </p>
          <p className="mt-1 text-xs text-text-tertiary">Per tenant</p>
        </div>
      </div>

      {/* Plans section */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Plans overview */}
        <div className="panel overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="section-header">Plans</h2>
          </div>
          <div className="p-5 space-y-4">
            {(data?.plan_breakdown ?? []).map((plan) => (
              <div key={plan.name} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-brand-500" />
                  <div>
                    <p className="font-medium text-text-primary">{plan.name}</p>
                    <p className="text-xs text-text-secondary">{plan.count} tenant(s)</p>
                  </div>
                </div>
                <p className="font-semibold text-text-primary">
                  {formatMoney(plan.monthly_revenue)}
                  <span className="text-xs font-normal text-text-secondary">/mo</span>
                </p>
              </div>
            ))}
            {(data?.plan_breakdown ?? []).length === 0 && (
              <p className="text-sm text-text-secondary">No paid tenants yet.</p>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="panel overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="section-header">Recent Activity</h2>
          </div>
          <div className="p-5">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="mb-3 h-10 w-10 text-brand-200" />
              {(data?.recent_activity ?? []).length === 0 ? (
                <>
                  <p className="text-text-secondary">No billing activity yet</p>
                  <p className="mt-1 text-xs text-text-tertiary">Activity will appear when tenant data flows in</p>
                </>
              ) : (
                <div className="w-full space-y-2 text-left">
                  {(data?.recent_activity ?? []).slice(0, 5).map((activity) => (
                    <div key={activity.id} className="rounded-lg border border-border p-3">
                      <p className="text-sm font-medium text-text-primary">{activity.workspace_name}</p>
                      <p className="text-xs text-text-secondary">{activity.description}</p>
                      <p className="text-xs text-text-tertiary">
                        {new Date(activity.occurred_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Integration notice */}
      <div className="rounded-xl border border-brand-100 bg-brand-50 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">Payment Integration</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Billing metrics are derived from active tenant usage. Connect payment provider webhooks
              to replace heuristic plan assignment with contract-backed subscription events.
            </p>
            <button
              disabled
              className="mt-3 rounded-lg bg-brand-500/70 px-4 py-2 text-sm font-medium text-white"
            >
              Provider Connection Pending
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
