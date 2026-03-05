"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  AuditLogItem,
  DeadlineItem,
  DocumentItem,
  EquityLevel,
  PolicyItem,
  RegulatoryUpdate,
  RiskItem,
  VisaStat,
  VisaTimelineItem,
} from "./data";

type PayEquityKpi = {
  id: string;
  label: string;
  value: string;
  subtitle: string;
  delta?: string;
  deltaDirection?: "up" | "down";
};

type ComplianceContextState = {
  loading: boolean;
  refreshing: boolean;
  complianceScore: number;
  activeEmployees: number;
  riskItems: RiskItem[];
  payEquityKpis: PayEquityKpi[];
  equityLevels: EquityLevel[];
  policyItems: PolicyItem[];
  regulatoryUpdates: RegulatoryUpdate[];
  deadlineItems: DeadlineItem[];
  visaStats: VisaStat[];
  visaTimeline: VisaTimelineItem[];
  documentItems: DocumentItem[];
  auditLogItems: AuditLogItem[];
  refresh: () => Promise<void>;
};

const ComplianceContext = createContext<ComplianceContextState | null>(null);

const DEFAULT_STATE: ComplianceContextState = {
  loading: true,
  refreshing: false,
  complianceScore: 0,
  activeEmployees: 0,
  riskItems: [],
  payEquityKpis: [],
  equityLevels: [],
  policyItems: [],
  regulatoryUpdates: [],
  deadlineItems: [],
  visaStats: [],
  visaTimeline: [],
  documentItems: [],
  auditLogItems: [],
  refresh: async () => {},
};

export function ComplianceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ComplianceContextState>(DEFAULT_STATE);

  const loadCompliance = async (triggerRefresh: boolean) => {
    try {
      if (triggerRefresh) {
        await fetch("/api/compliance/refresh", { method: "POST" });
      }
      const res = await fetch("/api/compliance");
      if (!res.ok) throw new Error("Failed to load compliance data");
      const data = await res.json();
      setState((prev) => ({
        ...prev,
        loading: false,
        refreshing: false,
        complianceScore: Number(data.compliance_score || 0),
        activeEmployees: Number(
          data.ai_scoring_metadata?.active_employees ??
            data.ai_scoring_metadata?.activeEmployees ??
            0
        ),
        riskItems: data.risk_items || [],
        payEquityKpis: data.pay_equity_kpis || [],
        equityLevels: data.equity_levels || [],
        policyItems: data.policy_items || [],
        regulatoryUpdates: data.regulatory_updates || [],
        deadlineItems: data.deadline_items || [],
        visaStats: data.visa_stats || [],
        visaTimeline: data.visa_timeline || [],
        documentItems: data.document_items || [],
        auditLogItems: data.audit_log_items || [],
      }));
    } catch {
      setState((prev) => ({ ...prev, loading: false, refreshing: false }));
    }
  };

  useEffect(() => {
    void loadCompliance(true);
  }, []);

  const refresh = async () => {
    setState((prev) => ({ ...prev, refreshing: true }));
    await loadCompliance(true);
  };

  const value = useMemo(
    () => ({
      ...state,
      refresh,
    }),
    [state]
  );
  return <ComplianceContext.Provider value={value}>{children}</ComplianceContext.Provider>;
}

export function useComplianceContext() {
  const context = useContext(ComplianceContext);
  if (!context) {
    throw new Error("useComplianceContext must be used within ComplianceProvider");
  }
  return context;
}
