"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FeatureNotEnabled } from "@/components/dashboard/feature-not-enabled";
import { isFeatureEnabled } from "@/lib/release/ga-scope";
import { 
  CreditCard, 
  Check, 
  Zap, 
  Building2, 
  Loader2,
  Calendar,
  Receipt,
  ArrowUpRight
} from "lucide-react";

export default function BillingPage() {
  const billingEnabled = isFeatureEnabled("billing");
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<{ name?: string } | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any | null>(null);

  useEffect(() => {
    async function getData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*, workspaces(*)")
          .eq("id", user.id)
          .single();
        if (profile) {
          setWorkspace(profile.workspaces);
        }
      }
      const billingRes = await fetch("/api/billing");
      if (billingRes.ok) {
        const billingData = await billingRes.json();
        setPlans(billingData.plans || []);
        setInvoices(billingData.invoices || []);
        setSubscription(billingData.subscription);
      }
      setLoading(false);
    }
    getData();
  }, [supabase]);

  if (!billingEnabled) {
    return <FeatureNotEnabled featureName="Billing" />;
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-accent-800 sm:text-3xl">Billing & Plans</h1>
        <p className="text-brand-600">Manage your subscription and billing details.</p>
      </div>

      {/* Current Plan Summary */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/25">
              <Zap size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-brand-900">{subscription?.billing_plans?.name || "No active plan"}</h2>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">Active</span>
              </div>
              <p className="text-sm text-brand-600">
                Your next billing date is <strong>{subscription?.next_billing_at ? new Date(subscription.next_billing_at).toLocaleDateString("en-GB") : "Not scheduled"}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <CreditCard size={16} className="mr-2" />
              Update Payment
            </Button>
            <Button variant="ghost" size="sm">
              Cancel Plan
            </Button>
          </div>
        </div>
        <div className="border-t border-border/50 bg-brand-50/30 px-6 py-4">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-brand-600">
              <Building2 size={16} className="text-brand-400" />
              <span><strong className="text-brand-900">{workspace?.name || "Your Workspace"}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-brand-600">
              <Calendar size={16} className="text-brand-400" />
              <span>Billing cycle: {subscription?.billing_cycle || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2 text-brand-600">
              <CreditCard size={16} className="text-brand-400" />
              <span>Card ending in {subscription?.payment_method_last4 || "N/A"}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="mb-6 text-lg font-bold text-brand-900">Available Plans</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = subscription?.billing_plans?.code === plan.code;
            const monthly = Number(plan.monthly_price || 0);
            const cta = isCurrent ? "Current Plan" : monthly > 0 ? "Upgrade" : "Contact Sales";
            return (
            <Card 
              key={plan.id} 
              className={`relative overflow-hidden p-6 transition-all hover:shadow-lg ${
                plan.code === "professional" ? "ring-2 ring-brand-500 shadow-lg shadow-brand-500/10" : ""
              } ${isCurrent ? "bg-brand-50/50" : ""}`}
            >
              {plan.code === "professional" && (
                <div className="absolute -right-8 top-4 rotate-45 bg-brand-500 px-10 py-1 text-xs font-bold text-white shadow-sm">
                  Popular
                </div>
              )}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-brand-900">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-brand-900">
                    {monthly > 0 ? `AED ${monthly}` : "Custom"}
                  </span>
                  <span className="text-brand-500">{monthly > 0 ? "/month" : ""}</span>
                </div>
                <p className="mt-2 text-sm text-brand-600">{plan.description}</p>
              </div>
              <ul className="mb-6 space-y-3">
                {(plan.features || []).map((feature: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-brand-700">
                    <Check size={16} className="shrink-0 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                fullWidth 
                variant={isCurrent ? "outline" : plan.code === "professional" ? "primary" : "ghost"}
                disabled={isCurrent}
              >
                {cta}
                {!isCurrent && <ArrowUpRight size={16} className="ml-1" />}
              </Button>
            </Card>
          )})}
        </div>
      </div>

      {/* Billing History */}
      <div>
        <h2 className="mb-6 text-lg font-bold text-brand-900">Billing History</h2>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-brand-50/30">
                  <th className="px-6 py-4 text-left font-bold text-brand-900 uppercase tracking-wider text-xs">Invoice</th>
                  <th className="px-6 py-4 text-left font-bold text-brand-900 uppercase tracking-wider text-xs">Date</th>
                  <th className="px-6 py-4 text-left font-bold text-brand-900 uppercase tracking-wider text-xs">Amount</th>
                  <th className="px-6 py-4 text-left font-bold text-brand-900 uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-4 text-right font-bold text-brand-900 uppercase tracking-wider text-xs"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-brand-50/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-brand-900">{invoice.invoice_number}</td>
                    <td className="px-6 py-4 text-brand-600">{new Date(invoice.issued_at).toLocaleDateString("en-GB")}</td>
                    <td className="px-6 py-4 font-semibold text-brand-900">{`${invoice.currency} ${Number(invoice.amount).toFixed(2)}`}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                        <Check size={12} />
                        {String(invoice.status || "").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-brand-500 hover:text-brand-700 font-medium text-xs">
                        <Receipt size={14} className="inline mr-1" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
