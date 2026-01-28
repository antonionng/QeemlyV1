// Compliance Preset Layouts

export type GridLayoutItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
};

export type CompliancePreset = {
  id: string;
  name: string;
  description: string;
  layout: GridLayoutItem[];
};

export const COMPLIANCE_PRESETS: Record<string, CompliancePreset> = {
  overview: {
    id: "overview",
    name: "Executive Overview",
    description: "High-level summary of your compliance posture",
    layout: [
      { i: "labor-law-tracker", x: 0, y: 0, w: 8, h: 3 },
      { i: "risk-heatmap", x: 8, y: 0, w: 4, h: 3 },
      { i: "visa-compliance", x: 0, y: 3, w: 4, h: 3 },
      { i: "document-vault", x: 4, y: 3, w: 4, h: 3 },
      { i: "compliance-calendar", x: 8, y: 3, w: 4, h: 3 },
    ],
  },
  regulatory: {
    id: "regulatory",
    name: "Regulatory Focus",
    description: "Deep dive into labor laws and policy management",
    layout: [
      { i: "labor-law-tracker", x: 0, y: 0, w: 12, h: 4 },
      { i: "policy-manager", x: 0, y: 4, w: 6, h: 3 },
      { i: "audit-log", x: 6, y: 4, w: 6, h: 3 },
    ],
  },
  risk: {
    id: "risk",
    name: "Risk & Equity",
    description: "Focus on pay equity and organizational risk",
    layout: [
      { i: "pay-equity-audit", x: 0, y: 0, w: 8, h: 4 },
      { i: "risk-heatmap", x: 8, y: 0, w: 4, h: 4 },
      { i: "audit-log", x: 0, y: 4, w: 12, h: 3 },
    ],
  },
};

export const DEFAULT_COMPLIANCE_PRESET_ID = "overview";
