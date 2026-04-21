// Comprehensive dummy data for Qeemly Dashboard
// Covering GCC markets with realistic compensation data

import type { BenchmarkTrustMetadata } from "@/lib/benchmarks/trust";
import type { BenchmarkPayPeriod } from "@/lib/benchmarks/pay-period";

export type Currency = "AED" | "SAR" | "QAR" | "BHD" | "KWD" | "OMR" | "GBP";

export type Location = {
  id: string;
  city: string;
  country: string;
  countryCode: string;
  currency: Currency;
  flag: string;
};

export type Level = {
  id: string;
  name: string;
  category: "IC" | "Manager" | "Executive";
};

export type Role = {
  id: string;
  title: string;
  family: string;
  icon: string;
};

export type PercentileData = {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
};

export type TrendPoint = {
  month: string;
  date: string;
  p25: number;
  p50: number;
  p75: number;
};

export type BenchmarkSource = "market" | "uploaded" | "ai-estimated";

export type SalaryBenchmark = {
  roleId: string;
  locationId: string;
  levelId: string;
  currency: Currency;
  /** Percentiles are normalized to this pay period in app-facing benchmark payloads. */
  payPeriod?: BenchmarkPayPeriod;
  /** Captures the original row period before normalization. */
  sourcePayPeriod?: BenchmarkPayPeriod;
  percentiles: PercentileData;
  sampleSize: number;
  confidence: "High" | "Medium" | "Low";
  lastUpdated: string;
  momChange: number;
  yoyChange: number;
  nationalsCostBreakdown?: {
    gpssaPct: number;
    nafisPct: number;
    totalCostMultiplier: number;
    gpssaAmount: number;
    nafisAmount: number;
    totalEmployerCost: number;
  };
  trend: TrendPoint[];
  /** Where this benchmark came from: "market" = Qeemly data pool, "uploaded" = company pay bands */
  benchmarkSource?: BenchmarkSource;
  benchmarkTrust?: BenchmarkTrustMetadata;
  benchmarkSegmentation?: {
    requestedIndustry?: string | null;
    requestedCompanySize?: string | null;
    matchedIndustry?: string | null;
    matchedCompanySize?: string | null;
    isSegmented: boolean;
    isFallback: boolean;
  };
};

export type WatchlistItem = {
  id: string;
  roleId: string;
  locationId: string;
  levelId: string;
  alertThreshold?: number;
  createdAt: string;
  lastViewed: string;
};

export type SearchActivity = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  roleId: string;
  locationId: string;
  levelId: string;
  timestamp: string;
  action: "search" | "export" | "compare" | "save";
};

export type Insight = {
  id: string;
  type: "trend" | "anomaly" | "opportunity" | "risk";
  title: string;
  description: string;
  metric?: string;
  change?: number;
  priority: "high" | "medium" | "low";
  relatedRoleId?: string;
  relatedLocationId?: string;
};

// UAE Salary Breakdown type - represents the component split of total salary
export type SalaryBreakdown = {
  total: number;
  basic: number;
  basicPercent: number;
  housing: number;
  housingPercent: number;
  transport: number;
  transportPercent: number;
  other: number;
  otherPercent: number;
};

// Percentile breakdowns for salary components
export type PercentileBreakdowns = {
  p25: SalaryBreakdown;
  p50: SalaryBreakdown;
  p75: SalaryBreakdown;
  p90: SalaryBreakdown;
};

// === STATIC DATA ===

export const INDUSTRIES = [
  "Fintech",
  "Ecommerce",
  "SaaS",
  "Telecom",
  "Banking",
  "Consulting",
  "GovTech",
  "HealthTech",
  "Energy",
  "Logistics",
  "Retail",
  "Travel",
];

export const COMPANY_SIZES = [
  "1-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5000+",
];

export const EXPERIENCE_BANDS = ["0-2", "3-5", "6-8", "9-12", "12+"];

export const COMP_TYPES = ["Base", "Bonus", "Equity", "Allowance"];

export const LOCATIONS: Location[] = [
  { id: "london", city: "London", country: "United Kingdom", countryCode: "GB", currency: "GBP", flag: "GB" },
  { id: "dubai", city: "Dubai", country: "UAE", countryCode: "AE", currency: "AED", flag: "AE" },
  { id: "abu-dhabi", city: "Abu Dhabi", country: "UAE", countryCode: "AE", currency: "AED", flag: "AE" },
  { id: "riyadh", city: "Riyadh", country: "Saudi Arabia", countryCode: "SA", currency: "SAR", flag: "SA" },
  { id: "jeddah", city: "Jeddah", country: "Saudi Arabia", countryCode: "SA", currency: "SAR", flag: "SA" },
  { id: "doha", city: "Doha", country: "Qatar", countryCode: "QA", currency: "QAR", flag: "QA" },
  { id: "manama", city: "Manama", country: "Bahrain", countryCode: "BH", currency: "BHD", flag: "BH" },
  { id: "kuwait-city", city: "Kuwait City", country: "Kuwait", countryCode: "KW", currency: "KWD", flag: "KW" },
  { id: "muscat", city: "Muscat", country: "Oman", countryCode: "OM", currency: "OMR", flag: "OM" },
];

export const LEVELS: Level[] = [
  { id: "ic1", name: "Junior (IC1)", category: "IC" },
  { id: "ic2", name: "Mid-Level (IC2)", category: "IC" },
  { id: "ic3", name: "Senior (IC3)", category: "IC" },
  { id: "ic4", name: "Staff (IC4)", category: "IC" },
  { id: "ic5", name: "Principal (IC5)", category: "IC" },
  { id: "m1", name: "Manager (M1)", category: "Manager" },
  { id: "m2", name: "Senior Manager (M2)", category: "Manager" },
  { id: "d1", name: "Director (D1)", category: "Executive" },
  { id: "d2", name: "Senior Director (D2)", category: "Executive" },
  { id: "vp", name: "VP", category: "Executive" },
];

export const ROLES: Role[] = [
  // Engineering
  { id: "swe", title: "Software Engineer", family: "Engineering", icon: "SWE" },
  { id: "swe-fe", title: "Frontend Engineer", family: "Engineering", icon: "FE" },
  { id: "swe-be", title: "Backend Engineer", family: "Engineering", icon: "BE" },
  { id: "swe-mobile", title: "Mobile Engineer", family: "Engineering", icon: "MOB" },
  { id: "swe-devops", title: "DevOps Engineer", family: "Engineering", icon: "DEV" },
  { id: "swe-data", title: "Data Engineer", family: "Engineering", icon: "DE" },
  { id: "swe-ml", title: "ML Engineer", family: "Engineering", icon: "ML" },
  { id: "swe-fullstack", title: "Full-Stack Engineer", family: "Engineering", icon: "FS" },
  { id: "swe-platform", title: "Platform Engineer", family: "Engineering", icon: "PLT" },
  { id: "swe-embedded", title: "Embedded Engineer", family: "Engineering", icon: "EMB" },
  { id: "sre", title: "Site Reliability Engineer", family: "Engineering", icon: "SRE" },
  { id: "security", title: "Security Engineer", family: "Engineering", icon: "SEC" },
  { id: "qa", title: "QA Engineer", family: "Engineering", icon: "QA" },
  { id: "qa-auto", title: "Automation Test Engineer", family: "Engineering", icon: "ATE" },
  { id: "solutions-arch", title: "Solutions Architect", family: "Engineering", icon: "SA" },
  { id: "cloud-eng", title: "Cloud Engineer", family: "Engineering", icon: "CLD" },
  { id: "network-eng", title: "Network Engineer", family: "Engineering", icon: "NET" },
  { id: "sys-admin", title: "Systems Administrator", family: "Engineering", icon: "SYS" },
  { id: "eng-manager", title: "Engineering Manager", family: "Engineering", icon: "EM" },
  { id: "vp-eng", title: "VP of Engineering", family: "Engineering", icon: "VPE" },
  { id: "cto", title: "Chief Technology Officer", family: "Engineering", icon: "CTO" },

  // AI & Machine Learning
  { id: "ai-engineer", title: "AI Engineer", family: "AI & ML", icon: "AIE" },
  { id: "ml-ops", title: "MLOps Engineer", family: "AI & ML", icon: "MLO" },
  { id: "nlp-engineer", title: "NLP Engineer", family: "AI & ML", icon: "NLP" },
  { id: "cv-engineer", title: "Computer Vision Engineer", family: "AI & ML", icon: "CV" },
  { id: "ai-researcher", title: "AI Research Scientist", family: "AI & ML", icon: "AIR" },

  // Data
  { id: "data-scientist", title: "Data Scientist", family: "Data", icon: "DS" },
  { id: "data-analyst", title: "Data Analyst", family: "Data", icon: "DA" },
  { id: "bi-analyst", title: "BI Analyst", family: "Data", icon: "BI" },
  { id: "analytics-eng", title: "Analytics Engineer", family: "Data", icon: "AE" },
  { id: "data-arch", title: "Data Architect", family: "Data", icon: "DAR" },
  { id: "head-data", title: "Head of Data", family: "Data", icon: "HD" },

  // Product
  { id: "pm", title: "Product Manager", family: "Product", icon: "PM" },
  { id: "tpm", title: "Technical PM", family: "Product", icon: "TPM" },
  { id: "product-analyst", title: "Product Analyst", family: "Product", icon: "PA" },
  { id: "growth-pm", title: "Growth Product Manager", family: "Product", icon: "GPM" },
  { id: "head-product", title: "Head of Product", family: "Product", icon: "HP" },
  { id: "cpo", title: "Chief Product Officer", family: "Product", icon: "CPO" },

  // Design
  { id: "designer", title: "Product Designer", family: "Design", icon: "UX" },
  { id: "ux-researcher", title: "UX Researcher", family: "Design", icon: "UXR" },
  { id: "ui-designer", title: "UI Designer", family: "Design", icon: "UI" },
  { id: "design-lead", title: "Design Lead", family: "Design", icon: "DL" },
  { id: "brand-designer", title: "Brand Designer", family: "Design", icon: "BD" },
  { id: "content-designer", title: "Content Designer", family: "Design", icon: "CD" },
  { id: "head-design", title: "Head of Design", family: "Design", icon: "HoD" },

  // Finance
  { id: "financial-analyst", title: "Financial Analyst", family: "Finance", icon: "FA" },
  { id: "accountant", title: "Accountant", family: "Finance", icon: "ACC" },
  { id: "finance-manager", title: "Finance Manager", family: "Finance", icon: "FM" },
  { id: "fp-a", title: "FP&A Analyst", family: "Finance", icon: "FPA" },
  { id: "controller", title: "Financial Controller", family: "Finance", icon: "FC" },
  { id: "treasury", title: "Treasury Analyst", family: "Finance", icon: "TRS" },
  { id: "cfo", title: "Chief Financial Officer", family: "Finance", icon: "CFO" },

  // HR & People
  { id: "hr-generalist", title: "HR Generalist", family: "People", icon: "HR" },
  { id: "hr-bp", title: "HR Business Partner", family: "People", icon: "HRBP" },
  { id: "recruiter", title: "Recruiter", family: "People", icon: "REC" },
  { id: "ta-lead", title: "Talent Acquisition Lead", family: "People", icon: "TAL" },
  { id: "comp-ben", title: "Compensation & Benefits Analyst", family: "People", icon: "CB" },
  { id: "people-ops", title: "People Operations Manager", family: "People", icon: "PO" },
  { id: "l-d", title: "Learning & Development Specialist", family: "People", icon: "LD" },
  { id: "chro", title: "Chief People Officer", family: "People", icon: "CPeO" },
  { id: "hr-coordinator", title: "HR Coordinator", family: "People", icon: "HRC" },
  { id: "payroll-specialist", title: "Payroll Specialist", family: "People", icon: "PAY" },
  { id: "talent-sourcer", title: "Talent Sourcer", family: "People", icon: "TS" },
  { id: "hris-analyst", title: "HRIS Analyst", family: "People", icon: "HRIS" },

  // Marketing
  { id: "marketing-manager", title: "Marketing Manager", family: "Marketing", icon: "MKT" },
  { id: "digital-marketing", title: "Digital Marketing Specialist", family: "Marketing", icon: "DM" },
  { id: "content-marketing", title: "Content Marketing Manager", family: "Marketing", icon: "CM" },
  { id: "performance-marketing", title: "Performance Marketing Manager", family: "Marketing", icon: "PMK" },
  { id: "seo-specialist", title: "SEO Specialist", family: "Marketing", icon: "SEO" },
  { id: "social-media", title: "Social Media Manager", family: "Marketing", icon: "SM" },
  { id: "brand-manager", title: "Brand Manager", family: "Marketing", icon: "BM" },
  { id: "cmo", title: "Chief Marketing Officer", family: "Marketing", icon: "CMO" },

  // Sales & Commercial
  { id: "sales-exec", title: "Sales Executive", family: "Sales", icon: "SE" },
  { id: "account-exec", title: "Account Executive", family: "Sales", icon: "AX" },
  { id: "account-manager", title: "Account Manager", family: "Sales", icon: "AM" },
  { id: "sales-manager", title: "Sales Manager", family: "Sales", icon: "SMG" },
  { id: "bdr", title: "Business Development Representative", family: "Sales", icon: "BDR" },
  { id: "bd-manager", title: "Business Development Manager", family: "Sales", icon: "BDM" },
  { id: "pre-sales", title: "Pre-Sales Engineer", family: "Sales", icon: "PS" },
  { id: "head-sales", title: "Head of Sales", family: "Sales", icon: "HoS" },
  { id: "cro", title: "Chief Revenue Officer", family: "Sales", icon: "CRO" },

  // Customer Success & Support
  { id: "cs-manager", title: "Customer Success Manager", family: "Customer Success", icon: "CSM" },
  { id: "cs-associate", title: "Customer Success Associate", family: "Customer Success", icon: "CSA" },
  { id: "support-eng", title: "Technical Support Engineer", family: "Customer Success", icon: "TSE" },
  { id: "head-cs", title: "Head of Customer Success", family: "Customer Success", icon: "HCS" },
  { id: "customer-ops-analyst", title: "Customer Operations Analyst", family: "Customer Success", icon: "COA" },
  { id: "customer-ops-manager", title: "Customer Operations Manager", family: "Customer Success", icon: "COM" },
  { id: "customer-support-rep", title: "Customer Support Representative", family: "Customer Success", icon: "CSR" },
  { id: "support-specialist", title: "Customer Support Specialist", family: "Customer Success", icon: "CSS" },
  { id: "implementation-specialist", title: "Implementation Specialist", family: "Customer Success", icon: "IS" },
  { id: "onboarding-specialist", title: "Onboarding Specialist", family: "Customer Success", icon: "ONB" },

  // Operations
  { id: "ops-manager", title: "Operations Manager", family: "Operations", icon: "OPS" },
  { id: "project-manager", title: "Project Manager", family: "Operations", icon: "PJM" },
  { id: "program-manager", title: "Program Manager", family: "Operations", icon: "PGM" },
  { id: "scrum-master", title: "Scrum Master", family: "Operations", icon: "SCR" },
  { id: "chief-of-staff", title: "Chief of Staff", family: "Operations", icon: "CoS" },
  { id: "coo", title: "Chief Operating Officer", family: "Operations", icon: "COO" },
  { id: "biz-ops-analyst", title: "Business Operations Analyst", family: "Operations", icon: "BOA" },
  { id: "biz-ops-manager", title: "Business Operations Manager", family: "Operations", icon: "BOM" },
  { id: "rev-ops-analyst", title: "Revenue Operations Analyst", family: "Operations", icon: "ROA" },
  { id: "rev-ops-manager", title: "Revenue Operations Manager", family: "Operations", icon: "ROM" },
  { id: "sales-ops-analyst", title: "Sales Operations Analyst", family: "Operations", icon: "SOA" },
  { id: "sales-ops-manager", title: "Sales Operations Manager", family: "Operations", icon: "SOM" },
  { id: "marketing-ops-manager", title: "Marketing Operations Manager", family: "Operations", icon: "MOM" },
  { id: "people-ops-analyst", title: "People Operations Analyst", family: "Operations", icon: "POA" },
  { id: "supply-chain-analyst", title: "Supply Chain Analyst", family: "Operations", icon: "SCA" },
  { id: "logistics-coordinator", title: "Logistics Coordinator", family: "Operations", icon: "LOG" },
  { id: "procurement-specialist", title: "Procurement Specialist", family: "Operations", icon: "PRC" },
  { id: "office-manager", title: "Office Manager", family: "Operations", icon: "OFM" },
  { id: "executive-assistant", title: "Executive Assistant", family: "Operations", icon: "EA" },
  { id: "admin-assistant", title: "Administrative Assistant", family: "Operations", icon: "ADM" },
  { id: "facilities-manager", title: "Facilities Manager", family: "Operations", icon: "FAC" },
  { id: "receptionist", title: "Receptionist", family: "Operations", icon: "RCP" },

  // Legal & Compliance
  { id: "legal-counsel", title: "Legal Counsel", family: "Legal", icon: "LC" },
  { id: "compliance-officer", title: "Compliance Officer", family: "Legal", icon: "CO" },
  { id: "risk-analyst", title: "Risk Analyst", family: "Legal", icon: "RA" },
  { id: "gc", title: "General Counsel", family: "Legal", icon: "GC" },

  // Executive
  { id: "ceo", title: "Chief Executive Officer", family: "Executive", icon: "CEO" },
  { id: "coo-exec", title: "Chief Operating Officer", family: "Executive", icon: "COO" },
  { id: "ciso", title: "Chief Information Security Officer", family: "Executive", icon: "CISO" },
  { id: "cdo", title: "Chief Data Officer", family: "Executive", icon: "CDO" },
];

// === HELPER FUNCTIONS ===

export function generateTrendData(baseP50: number, volatility: number = 0.02): TrendPoint[] {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  
  const currentYear = 2026;
  let currentP50 = baseP50 * (1 - volatility * 6);
  
  return months.map((month, i) => {
    const change = (Math.random() - 0.3) * volatility;
    currentP50 = currentP50 * (1 + change);
    const spread = 0.2 + Math.random() * 0.1;
    
    return {
      month,
      date: `${currentYear}-${String(i + 1).padStart(2, "0")}-01`,
      p25: Math.round(currentP50 * (1 - spread / 2)),
      p50: Math.round(currentP50),
      p75: Math.round(currentP50 * (1 + spread / 2)),
    };
  });
}

export function getConfidence(sampleSize: number): "High" | "Medium" | "Low" {
  if (sampleSize >= 50) return "High";
  if (sampleSize >= 20) return "Medium";
  return "Low";
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickFrom<T>(options: T[], seed: number) {
  return options[seed % options.length];
}

export function getBenchmarkAttributes(roleId: string, locationId: string, levelId: string) {
  const seed = hashString(`${roleId}:${locationId}:${levelId}`);
  const industry = pickFrom(INDUSTRIES, seed);
  const companySize = pickFrom(COMPANY_SIZES, seed + 11);
  const experienceBand = pickFrom(EXPERIENCE_BANDS, seed + 27);
  const compTypes = COMP_TYPES.filter((_, idx) => ((seed >> idx) & 1) === 1);
  return {
    industry,
    companySize,
    experienceBand,
    compTypes: compTypes.length ? compTypes : ["Base"],
  };
}

// Base salaries by role (monthly AED for IC3 in Dubai as baseline)
const BASE_SALARIES: Record<string, number> = {
  "swe": 32000,
  "swe-fe": 30000,
  "swe-be": 33000,
  "swe-mobile": 31000,
  "swe-devops": 34000,
  "swe-data": 35000,
  "swe-ml": 42000,
  "pm": 38000,
  "tpm": 40000,
  "designer": 28000,
  "ux-researcher": 26000,
  "data-scientist": 40000,
  "data-analyst": 25000,
  "security": 36000,
  "qa": 22000,
};

// Level multipliers
const LEVEL_MULTIPLIERS: Record<string, number> = {
  "ic1": 0.55,
  "ic2": 0.75,
  "ic3": 1.0,
  "ic4": 1.35,
  "ic5": 1.7,
  "m1": 1.4,
  "m2": 1.7,
  "d1": 2.0,
  "d2": 2.4,
  "vp": 3.0,
};

// Location multipliers (relative to Dubai)
const LOCATION_MULTIPLIERS: Record<string, number> = {
  "dubai": 1.0,
  "abu-dhabi": 0.95,
  "riyadh": 1.15,
  "jeddah": 1.05,
  "doha": 1.2,
  "manama": 0.85,
  "kuwait-city": 1.1,
  "muscat": 0.8,
};

// Currency conversion from AED
const CURRENCY_FROM_AED: Record<Currency, number> = {
  "AED": 1,
  "GBP": 0.215,
  "SAR": 1.02,
  "QAR": 0.99,
  "BHD": 0.103,
  "KWD": 0.084,
  "OMR": 0.105,
};

export function generateBenchmark(
  roleId: string,
  locationId: string,
  levelId: string
): SalaryBenchmark {
  const fallbackLocation = LOCATIONS.find(l => l.id === "dubai") || LOCATIONS[0];
  const location = LOCATIONS.find(l => l.id === locationId) || fallbackLocation;
  const baseSalary = BASE_SALARIES[roleId] || 30000;
  const levelMult = LEVEL_MULTIPLIERS[levelId] || 1.0;
  const locMult = LOCATION_MULTIPLIERS[locationId] || 1.0;
  const currencyMult = CURRENCY_FROM_AED[location.currency] || 1;
  
  const adjustedBase = baseSalary * levelMult * locMult * currencyMult;
  const variance = 0.15 + Math.random() * 0.1;
  
  const p50 = Math.round(adjustedBase);
  const percentiles: PercentileData = {
    p10: Math.round(p50 * (1 - variance * 1.5)),
    p25: Math.round(p50 * (1 - variance)),
    p50,
    p75: Math.round(p50 * (1 + variance)),
    p90: Math.round(p50 * (1 + variance * 1.5)),
  };
  
  const sampleSize = Math.floor(15 + Math.random() * 85);
  const momChange = (Math.random() - 0.3) * 5;
  const yoyChange = (Math.random() - 0.2) * 12;

  const isUaeLocation = ['dubai', 'abu-dhabi'].includes(locationId);
  const nationalsCostBreakdown = isUaeLocation ? (() => {
    const gpssaPct = 12.5;
    const nafisPct = locationId === 'abu-dhabi' ? 4 : 0;
    const totalCostMultiplier = 1 + (gpssaPct + nafisPct) / 100;
    const annualP50 = p50 * 12;
    return {
      gpssaPct,
      nafisPct,
      totalCostMultiplier,
      gpssaAmount: Math.round(annualP50 * gpssaPct / 100),
      nafisAmount: Math.round(annualP50 * nafisPct / 100),
      totalEmployerCost: Math.round(annualP50 * totalCostMultiplier),
    };
  })() : undefined;

  return {
    roleId,
    locationId,
    levelId,
    currency: location.currency,
    percentiles,
    sampleSize,
    confidence: getConfidence(sampleSize),
    lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    momChange: Math.round(momChange * 10) / 10,
    yoyChange: Math.round(yoyChange * 10) / 10,
    nationalsCostBreakdown,
    trend: generateTrendData(p50),
  };
}

// === PRE-GENERATED DATA ===

// Featured benchmarks for dashboard
export const FEATURED_BENCHMARKS: SalaryBenchmark[] = [
  // Real-data mode: this list is populated from database-backed flows.
];

// Market pulse data
export const MARKET_PULSE = {
  totalDataPoints: 0,
  lastUpdated: new Date().toISOString(),
  weeklySubmissions: 0,
  activeCompanies: 0,
  marketsTracked: LOCATIONS.length,
  rolesTracked: ROLES.length,
  averageConfidence: 0,
  dataFreshness: 0,
  marketTrend: 0,
  volatilityIndex: 0,
};

// Market Outlook data
export const MARKET_OUTLOOK = {
  sentiment: 0,
  hiringVelocity: "N/A",
  velocityValue: 0,
  topSkillsDemand: [] as string[],
  marketStatus: "N/A",
  summary: "No outlook is available until benchmark data is ingested.",
};

// Geographic comparison data
export const GEO_COMPARISON: Array<{
  location: Location;
  medianSalary: number;
  yoyChange: number;
  sampleSize: number;
  confidence: SalaryBenchmark["confidence"];
}> = [];

// Sample watchlist
export const SAMPLE_WATCHLIST: WatchlistItem[] = [];

// Sample activity feed
export const SAMPLE_ACTIVITY: SearchActivity[] = [];

// AI Insights
export const SAMPLE_INSIGHTS: Insight[] = [];

// Role comparison data
export function getRoleComparison(roleIds: string[], locationId: string, levelId: string) {
  return roleIds.map(roleId => {
    const role = ROLES.find(r => r.id === roleId)!;
    const benchmark = generateBenchmark(roleId, locationId, levelId);
    return {
      role,
      benchmark,
    };
  });
}

// Level progression data for a role
export function getLevelProgression(roleId: string, locationId: string) {
  return LEVELS.filter(l => l.category === "IC" || l.category === "Manager")
    .slice(0, 6)
    .map(level => {
      const benchmark = generateBenchmark(roleId, locationId, level.id);
      return {
        level,
        benchmark,
      };
    });
}

// === FORMATTING UTILITIES ===

export function formatCurrency(currency: Currency, amount: number): string {
  return `${currency} ${amount.toLocaleString("en-US")}`;
}

export function formatCurrencyK(currency: Currency, amount: number): string {
  if (amount >= 1000) {
    const k = Math.round(amount / 100) / 10;
    return `${currency} ${k.toFixed(k % 1 === 0 ? 0 : 1)}k`;
  }
  return formatCurrency(currency, amount);
}

export function formatPercentage(value: number, showSign = true): string {
  const sign = showSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getRole(roleId: string): Role | undefined {
  return ROLES.find(r => r.id === roleId);
}

export function getLocation(locationId: string): Location | undefined {
  return LOCATIONS.find(l => l.id === locationId);
}

export function getLevel(levelId: string): Level | undefined {
  return LEVELS.find(l => l.id === levelId);
}

// === NEW HELPER FUNCTIONS FOR ANALYTICAL WIDGETS ===

export function getIndustryBreakdown(roleId: string, locationId: string, levelId: string) {
  const benchmark = generateBenchmark(roleId, locationId, levelId);
  const median = benchmark.percentiles.p50;
  
  return INDUSTRIES.map((industry, i) => {
    const variance = 0.85 + (Math.sin(i + hashString(roleId)) + 1) * 0.15; // Realistic variation by sector
    return {
      industry,
      median: Math.round(median * variance),
    };
  }).sort((a, b) => b.median - a.median);
}

export function getCompanySizePremium(roleId: string, locationId: string, levelId: string) {
  const benchmark = generateBenchmark(roleId, locationId, levelId);
  const median = benchmark.percentiles.p50;
  
  // Larger companies typically pay more
  const sizeMultipliers = [0.85, 0.9, 0.95, 1.05, 1.15, 1.25];
  
  return COMPANY_SIZES.map((size, i) => ({
    size,
    median: Math.round(median * sizeMultipliers[i]),
  }));
}

export function getExperienceMatrix(roleId: string, locationId: string) {
  return LEVELS.map(level => {
    const benchmark = generateBenchmark(roleId, locationId, level.id);
    return {
      level: level.name,
      p25: benchmark.percentiles.p25,
      p50: benchmark.percentiles.p50,
      p75: benchmark.percentiles.p75,
    };
  });
}export function getCompMix(roleId: string, locationId: string, levelId: string) {
  const benchmark = generateBenchmark(roleId, locationId, levelId);
  const total = benchmark.percentiles.p50;
  
  // Higher levels typically have more equity/bonus mix
  const levelIndex = LEVELS.findIndex(l => l.id === levelId);
  const bonusWeight = 0.05 + (levelIndex / LEVELS.length) * 0.15;
  const equityWeight = (levelIndex / LEVELS.length) * 0.25;
  const baseWeight = 1 - bonusWeight - equityWeight;
  
  return [
    { name: "Base", value: Math.round(total * baseWeight) },
    { name: "Bonus", value: Math.round(total * bonusWeight) },
    { name: "Equity", value: Math.round(total * equityWeight) },
  ];
}

// === UAE SALARY BREAKDOWN FUNCTIONS ===
// In the UAE region, salaries are typically broken down into:
// - Basic Salary: 50-65% (used for end-of-service benefits calculations)
// - Housing/Accommodation: 20-30%
// - Transport Allowance: 5-12%
// - Other Allowances: 3-8%

/**
 * Generate a salary breakdown for a given total salary
 * Senior roles tend to have higher basic % to maximize end-of-service benefits
 */
export function generateSalaryBreakdown(total: number, levelId?: string): SalaryBreakdown {
  // Senior roles tend to have higher basic salary percentages
  const levelIndex = levelId ? LEVELS.findIndex(l => l.id === levelId) : 3;
  const seniorityFactor = Math.min(1, (levelIndex + 1) / LEVELS.length);
  
  // Basic salary: 50-65% (higher for senior roles)
  const basicPercent = 50 + Math.round(seniorityFactor * 15);
  
  // Housing: 20-30% (slightly lower for senior roles as basic takes more)
  const housingPercent = 30 - Math.round(seniorityFactor * 10);
  
  // Transport: 5-12%
  const transportPercent = 12 - Math.round(seniorityFactor * 7);
  
  // Other: remainder (typically 3-8%)
  const otherPercent = 100 - basicPercent - housingPercent - transportPercent;
  
  return {
    total,
    basic: Math.round(total * basicPercent / 100),
    basicPercent,
    housing: Math.round(total * housingPercent / 100),
    housingPercent,
    transport: Math.round(total * transportPercent / 100),
    transportPercent,
    other: Math.round(total * otherPercent / 100),
    otherPercent,
  };
}

/**
 * Generate salary breakdowns for all percentiles of a benchmark
 */
export function getPercentileBreakdowns(
  roleId: string,
  locationId: string,
  levelId: string
): PercentileBreakdowns {
  const benchmark = generateBenchmark(roleId, locationId, levelId);
  
  return {
    p25: generateSalaryBreakdown(benchmark.percentiles.p25, levelId),
    p50: generateSalaryBreakdown(benchmark.percentiles.p50, levelId),
    p75: generateSalaryBreakdown(benchmark.percentiles.p75, levelId),
    p90: generateSalaryBreakdown(benchmark.percentiles.p90, levelId),
  };
}

/**
 * Get market average breakdown percentages for a given level
 * Returns the typical split percentages seen in the market
 */
export function getMarketBreakdownAverages(levelId: string): {
  basicRange: { min: number; max: number; typical: number };
  housingRange: { min: number; max: number; typical: number };
  transportRange: { min: number; max: number; typical: number };
  otherRange: { min: number; max: number; typical: number };
} {
  const levelIndex = LEVELS.findIndex(l => l.id === levelId);
  const seniorityFactor = Math.min(1, (levelIndex + 1) / LEVELS.length);
  
  const typicalBasic = 50 + Math.round(seniorityFactor * 15);
  const typicalHousing = 30 - Math.round(seniorityFactor * 10);
  const typicalTransport = 12 - Math.round(seniorityFactor * 7);
  const typicalOther = 100 - typicalBasic - typicalHousing - typicalTransport;
  
  return {
    basicRange: { min: 50, max: 65, typical: typicalBasic },
    housingRange: { min: 20, max: 30, typical: typicalHousing },
    transportRange: { min: 5, max: 12, typical: typicalTransport },
    otherRange: { min: 3, max: 8, typical: typicalOther },
  };
}