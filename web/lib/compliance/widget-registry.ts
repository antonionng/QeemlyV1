// Compliance Widget Registry - Defines all available compliance widgets

import type { LucideIcon } from "lucide-react";
import {
  ShieldCheck,
  FileText,
  Users,
  AlertTriangle,
  History,
  FileSearch,
  Scale,
  Globe,
  Lock,
  Calendar,
} from "lucide-react";

export type WidgetSize = "small" | "medium" | "large" | "full";

export type ComplianceWidgetDefinition = {
  id: string;
  name: string;
  description: string;
  tooltipExplanation: string;
  icon: LucideIcon;
  defaultSize: WidgetSize;
  minWidth: number;  // Grid units (1-12)
  minHeight: number; // Grid units
  maxWidth?: number;
  maxHeight?: number;
  category: "monitoring" | "documents" | "analysis" | "risk" | "governance";
};

export const COMPLIANCE_WIDGET_REGISTRY: Record<string, ComplianceWidgetDefinition> = {
  "labor-law-tracker": {
    id: "labor-law-tracker",
    name: "Labor Law Tracker",
    description: "Real-time updates on GCC labor regulations",
    tooltipExplanation: "Stay updated with the latest changes in labor laws across UAE, KSA, Qatar, and other GCC countries. Tracks Gratuity changes, Working Hour regulations, and Emiratization/Nitaqat quotas.",
    icon: Scale,
    defaultSize: "large",
    minWidth: 6,
    minHeight: 3,
    category: "monitoring",
  },
  "pay-equity-audit": {
    id: "pay-equity-audit",
    name: "Pay Equity Audit",
    description: "Gender and demographic pay gap analysis",
    tooltipExplanation: "Automatically analyzes your payroll data to identify statistically significant pay gaps by gender, nationality, or department. Helps ensure compliance with international equal pay standards.",
    icon: Users,
    defaultSize: "large",
    minWidth: 6,
    minHeight: 3,
    category: "analysis",
  },
  "document-vault": {
    id: "document-vault",
    name: "Document Vault",
    description: "Centralized compliance document management",
    tooltipExplanation: "Secure storage for essential compliance documents including Trade Licenses, Insurance Policies, and Employee Handbooks. Includes automated expiry alerts.",
    icon: Lock,
    defaultSize: "medium",
    minWidth: 4,
    minHeight: 3,
    category: "documents",
  },
  "visa-compliance": {
    id: "visa-compliance",
    name: "Visa & Permit Status",
    description: "Track work permit and residency expiries",
    tooltipExplanation: "Monitor the status of all employee visas, work permits, and Emirates IDs/Iqamas. Proactive alerts for upcoming renewals to avoid regulatory fines.",
    icon: Globe,
    defaultSize: "medium",
    minWidth: 4,
    minHeight: 3,
    category: "monitoring",
  },
  "risk-heatmap": {
    id: "risk-heatmap",
    name: "Risk Heatmap",
    description: "Visualizing organizational compliance risks",
    tooltipExplanation: "Identifies areas of highest regulatory risk based on document completeness, audit history, and recent regulatory changes in your specific industry.",
    icon: AlertTriangle,
    defaultSize: "medium",
    minWidth: 4,
    minHeight: 3,
    category: "risk",
  },
  "audit-log": {
    id: "audit-log",
    name: "Audit Log",
    description: "History of compliance-related changes",
    tooltipExplanation: "A tamper-proof record of all compliance actions, document uploads, and policy acknowledgments. Essential for internal and external regulatory audits.",
    icon: History,
    defaultSize: "medium",
    minWidth: 4,
    minHeight: 3,
    category: "governance",
  },
  "policy-manager": {
    id: "policy-manager",
    name: "Policy Manager",
    description: "Employee handbook and policy tracking",
    tooltipExplanation: "Distribute and track acknowledgment of company policies. Ensure every employee has signed the latest version of your Code of Conduct, NDA, and Remote Work policies.",
    icon: FileText,
    defaultSize: "small",
    minWidth: 3,
    minHeight: 2,
    category: "governance",
  },
  "compliance-calendar": {
    id: "compliance-calendar",
    name: "Compliance Calendar",
    description: "Upcoming regulatory deadlines",
    tooltipExplanation: "Key dates for tax filings, license renewals, and mandatory reporting requirements in your jurisdictions.",
    icon: Calendar,
    defaultSize: "small",
    minWidth: 3,
    minHeight: 2,
    category: "monitoring",
  },
};

export const ALL_COMPLIANCE_WIDGET_IDS = Object.keys(COMPLIANCE_WIDGET_REGISTRY);

export function getComplianceWidgetDefinition(widgetId: string): ComplianceWidgetDefinition | undefined {
  return COMPLIANCE_WIDGET_REGISTRY[widgetId];
}

export function getComplianceWidgetsByCategory(category: ComplianceWidgetDefinition["category"]): ComplianceWidgetDefinition[] {
  return Object.values(COMPLIANCE_WIDGET_REGISTRY).filter(w => w.category === category);
}
