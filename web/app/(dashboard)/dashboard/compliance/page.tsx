"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ComplianceTopStrip } from "@/components/dashboard/compliance/compliance-top-strip";
import { ComplianceRiskIndexCard } from "@/components/dashboard/compliance/compliance-risk-index-card";
import { CompliancePayEquityCard } from "@/components/dashboard/compliance/compliance-pay-equity-card";
import { CompliancePolicyCard } from "@/components/dashboard/compliance/compliance-policy-completion-card";
import { ComplianceUpdatesCard } from "@/components/dashboard/compliance/compliance-updates-list-card";
import { ComplianceSideDeadlines } from "@/components/dashboard/compliance/compliance-side-deadlines-card";
import { ComplianceSideVisa } from "@/components/dashboard/compliance/compliance-side-visa-card";
import { ComplianceSideDocs } from "@/components/dashboard/compliance/compliance-side-docs-card";
import { ComplianceSideAudit } from "@/components/dashboard/compliance/compliance-side-audit-card";
import { ComplianceDetailDrawer } from "@/components/dashboard/compliance/compliance-detail-drawer";
import type { DrawerContent } from "@/lib/compliance/data";
import { ComplianceProvider, useComplianceContext } from "@/lib/compliance/context";

const LOADING_STEPS = [
  "Pulling workforce and contract records",
  "Running risk and governance scoring checks",
  "Reviewing policy, visa, audit, and pay signals",
  "Building your compliance and governance dashboard view",
] as const;

function ComplianceLoadingState() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 1300);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
        <h2 className="text-lg font-semibold text-brand-900">Loading compliance and governance data</h2>
      </div>
      <p className="mt-2 text-sm text-accent-600">
        We are preparing your latest workforce risk and pay governance snapshot. This usually takes a few seconds.
      </p>

      <div className="mt-6 space-y-3">
        {LOADING_STEPS.map((step, idx) => {
          const isDone = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <div
              key={step}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                isActive
                  ? "border-brand-200 bg-brand-50 text-brand-900"
                  : "border-border bg-white text-accent-600"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : isActive ? (
                <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
              ) : (
                <Circle className="h-4 w-4 text-accent-400" />
              )}
              <span className="text-sm">{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompliancePageContent() {
  const [drawer, setDrawer] = useState<DrawerContent>(null);
  const [view, setView] = useState<"workforce" | "governance">("workforce");
  const { loading } = useComplianceContext();

  if (loading) {
    return (
      <div className="bench-results relative z-10 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-accent-800 sm:text-3xl">
            Workforce Compliance & Governance
          </h1>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="h-10 gap-2 rounded-full border-border bg-white px-5 text-sm font-semibold text-brand-900 disabled:opacity-70"
          >
            <Download className="h-4 w-4" />
            Export Snapshot
          </Button>
        </div>
        <ComplianceLoadingState />
      </div>
    );
  }

  return (
    <div className="bench-results relative z-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-accent-800 sm:text-3xl">
          Workforce Compliance & Governance
        </h1>
        <Button
          variant="outline"
          size="sm"
          disabled
          className="h-10 gap-2 rounded-full border-border bg-white px-5 text-sm font-semibold text-brand-900"
        >
          <Download className="h-4 w-4" />
          Export Snapshot
        </Button>
      </div>

      {/* Status strip */}
      <ComplianceTopStrip />

      <div className="inline-flex gap-1 rounded-xl border border-border bg-surface-2 p-1">
        <button
          type="button"
          onClick={() => setView("workforce")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            view === "workforce"
              ? "bg-white text-brand-900 shadow-sm"
              : "text-brand-600 hover:text-brand-800"
          }`}
        >
          Workforce Compliance
        </button>
        <button
          type="button"
          onClick={() => setView("governance")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            view === "governance"
              ? "bg-white text-brand-900 shadow-sm"
              : "text-brand-600 hover:text-brand-800"
          }`}
        >
          Compensation Governance
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-xs text-accent-600">
        {view === "workforce" ? (
          <>
            <span>Manage workforce rules and records in settings.</span>
            <Link
              href="/dashboard/settings?tab=compliance"
              className="font-semibold text-brand-700 hover:text-brand-900"
            >
              Open Workforce Compliance Settings
            </Link>
          </>
        ) : (
          <>
            <span>Tune pay governance decisions from compensation defaults and reports.</span>
            <Link
              href="/dashboard/settings?tab=compensation"
              className="font-semibold text-brand-700 hover:text-brand-900"
            >
              Open Compensation Defaults
            </Link>
          </>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]">
        {/* Main column */}
        <div className="space-y-6">
          <ComplianceRiskIndexCard
            domain={view}
            onItemClick={(item) => setDrawer({ type: "risk", item })}
          />
          {view === "governance" ? (
            <CompliancePayEquityCard />
          ) : (
            <>
              <CompliancePolicyCard onItemClick={(item) => setDrawer({ type: "policy", item })} />
              <ComplianceUpdatesCard onItemClick={(item) => setDrawer({ type: "update", item })} />
            </>
          )}
        </div>

        {/* Right rail */}
        {view === "workforce" ? (
          <div className="space-y-6">
            <ComplianceSideDeadlines
              onItemClick={(item) => setDrawer({ type: "deadline", item })}
              onViewAll={() => setDrawer({ type: "deadlines-all" })}
            />
            <ComplianceSideVisa
              onItemClick={(item) => setDrawer({ type: "visa", item })}
              onViewAll={() => setDrawer({ type: "visa-all" })}
            />
            <ComplianceSideDocs
              onItemClick={(item) => setDrawer({ type: "document", item })}
              onViewAll={() => setDrawer({ type: "documents-all" })}
            />
            <ComplianceSideAudit
              onItemClick={(item) => setDrawer({ type: "audit", item })}
              onViewAll={() => setDrawer({ type: "audit-all" })}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <h4 className="text-sm font-bold text-brand-900">Governance Focus</h4>
              <p className="mt-2 text-xs leading-relaxed text-accent-600">
                This view focuses on pay controls: benchmark coverage, out-of-band compensation,
                and equity distribution by level.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      <ComplianceDetailDrawer content={drawer} onClose={() => setDrawer(null)} />
    </div>
  );
}

export default function CompliancePage() {
  return (
    <ComplianceProvider>
      <CompliancePageContent />
    </ComplianceProvider>
  );
}
