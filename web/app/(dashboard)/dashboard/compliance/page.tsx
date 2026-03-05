"use client";

import { useState } from "react";
import { Download } from "lucide-react";
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
import { ComplianceProvider } from "@/lib/compliance/context";

export default function CompliancePage() {
  const [drawer, setDrawer] = useState<DrawerContent>(null);

  return (
    <ComplianceProvider>
      <div className="bench-results space-y-6 relative z-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-accent-800 sm:text-3xl">
          Compliance
        </h1>
        <Button
          variant="outline"
          size="sm"
          className="h-10 gap-2 rounded-full border-border bg-white px-5 text-sm font-semibold text-brand-900"
        >
          <Download className="h-4 w-4" />
          Audit
        </Button>
      </div>

      {/* Status strip */}
      <ComplianceTopStrip />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]">
        {/* Main column */}
        <div className="space-y-6">
          <ComplianceRiskIndexCard onItemClick={(item) => setDrawer({ type: "risk", item })} />
          <CompliancePayEquityCard />
          <CompliancePolicyCard onItemClick={(item) => setDrawer({ type: "policy", item })} />
          <ComplianceUpdatesCard onItemClick={(item) => setDrawer({ type: "update", item })} />
        </div>

        {/* Right rail */}
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
      </div>

      {/* Detail drawer */}
        <ComplianceDetailDrawer content={drawer} onClose={() => setDrawer(null)} />
      </div>
    </ComplianceProvider>
  );
}
