// Comprehensive dummy data for Qeemly Dashboard
// Covering GCC markets with realistic compensation data

export type Currency = "AED" | "SAR" | "QAR" | "BHD" | "KWD" | "OMR";

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

export type SalaryBenchmark = {
  roleId: string;
  locationId: string;
  levelId: string;
  currency: Currency;
  percentiles: PercentileData;
  sampleSize: number;
  confidence: "High" | "Medium" | "Low";
  lastUpdated: string;
  momChange: number;
  yoyChange: number;
  trend: TrendPoint[];
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
  { id: "swe", title: "Software Engineer", family: "Engineering", icon: "SWE" },
  { id: "swe-fe", title: "Frontend Engineer", family: "Engineering", icon: "FE" },
  { id: "swe-be", title: "Backend Engineer", family: "Engineering", icon: "BE" },
  { id: "swe-mobile", title: "Mobile Engineer", family: "Engineering", icon: "MOB" },
  { id: "swe-devops", title: "DevOps Engineer", family: "Engineering", icon: "DEV" },
  { id: "swe-data", title: "Data Engineer", family: "Engineering", icon: "DE" },
  { id: "swe-ml", title: "ML Engineer", family: "Engineering", icon: "ML" },
  { id: "pm", title: "Product Manager", family: "Product", icon: "PM" },
  { id: "tpm", title: "Technical PM", family: "Product", icon: "TPM" },
  { id: "designer", title: "Product Designer", family: "Design", icon: "UX" },
  { id: "ux-researcher", title: "UX Researcher", family: "Design", icon: "UXR" },
  { id: "data-scientist", title: "Data Scientist", family: "Data", icon: "DS" },
  { id: "data-analyst", title: "Data Analyst", family: "Data", icon: "DA" },
  { id: "security", title: "Security Engineer", family: "Engineering", icon: "SEC" },
  { id: "qa", title: "QA Engineer", family: "Engineering", icon: "QA" },
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
  const location = LOCATIONS.find(l => l.id === locationId)!;
  const baseSalary = BASE_SALARIES[roleId] || 30000;
  const levelMult = LEVEL_MULTIPLIERS[levelId] || 1.0;
  const locMult = LOCATION_MULTIPLIERS[locationId] || 1.0;
  const currencyMult = CURRENCY_FROM_AED[location.currency];
  
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
    trend: generateTrendData(p50),
  };
}

// === PRE-GENERATED DATA ===

// Featured benchmarks for dashboard
export const FEATURED_BENCHMARKS: SalaryBenchmark[] = [
  generateBenchmark("swe", "dubai", "ic3"),
  generateBenchmark("swe-be", "dubai", "ic3"),
  generateBenchmark("pm", "dubai", "ic3"),
  generateBenchmark("data-scientist", "dubai", "ic3"),
  generateBenchmark("swe", "riyadh", "ic3"),
  generateBenchmark("swe-ml", "doha", "ic4"),
];

// Market pulse data
export const MARKET_PULSE = {
  totalDataPoints: 147892,
  lastUpdated: new Date().toISOString(),
  weeklySubmissions: 2847,
  activeCompanies: 312,
  marketsTracked: LOCATIONS.length,
  rolesTracked: ROLES.length,
  averageConfidence: 0.84,
  dataFreshness: 0.92,
  marketTrend: 2.3, // % change
  volatilityIndex: 0.15,
};

// Geographic comparison data
export const GEO_COMPARISON = LOCATIONS.map(loc => {
  const benchmark = generateBenchmark("swe", loc.id, "ic3");
  return {
    location: loc,
    medianSalary: benchmark.percentiles.p50,
    yoyChange: benchmark.yoyChange,
    sampleSize: benchmark.sampleSize,
    confidence: benchmark.confidence,
  };
}).sort((a, b) => b.medianSalary - a.medianSalary);

// Sample watchlist
export const SAMPLE_WATCHLIST: WatchlistItem[] = [
  {
    id: "w1",
    roleId: "swe",
    locationId: "dubai",
    levelId: "ic3",
    alertThreshold: 5,
    createdAt: "2025-11-15T10:00:00Z",
    lastViewed: "2026-01-07T14:30:00Z",
  },
  {
    id: "w2",
    roleId: "pm",
    locationId: "riyadh",
    levelId: "m1",
    createdAt: "2025-12-01T09:00:00Z",
    lastViewed: "2026-01-06T11:00:00Z",
  },
  {
    id: "w3",
    roleId: "data-scientist",
    locationId: "doha",
    levelId: "ic4",
    alertThreshold: 3,
    createdAt: "2025-12-20T16:00:00Z",
    lastViewed: "2026-01-08T09:15:00Z",
  },
  {
    id: "w4",
    roleId: "swe-ml",
    locationId: "dubai",
    levelId: "ic4",
    createdAt: "2026-01-02T08:00:00Z",
    lastViewed: "2026-01-08T08:00:00Z",
  },
];

// Sample activity feed
export const SAMPLE_ACTIVITY: SearchActivity[] = [
  {
    id: "a1",
    userId: "u1",
    userName: "Sarah Chen",
    userAvatar: "SC",
    roleId: "swe",
    locationId: "dubai",
    levelId: "ic3",
    timestamp: "2026-01-08T10:45:00Z",
    action: "search",
  },
  {
    id: "a2",
    userId: "u2",
    userName: "Ahmed Al-Hassan",
    userAvatar: "AA",
    roleId: "pm",
    locationId: "riyadh",
    levelId: "m1",
    timestamp: "2026-01-08T10:30:00Z",
    action: "export",
  },
  {
    id: "a3",
    userId: "u3",
    userName: "Maria Santos",
    userAvatar: "MS",
    roleId: "data-scientist",
    locationId: "dubai",
    levelId: "ic4",
    timestamp: "2026-01-08T10:15:00Z",
    action: "compare",
  },
  {
    id: "a4",
    userId: "u1",
    userName: "Sarah Chen",
    userAvatar: "SC",
    roleId: "swe-ml",
    locationId: "doha",
    levelId: "ic3",
    timestamp: "2026-01-08T09:50:00Z",
    action: "save",
  },
  {
    id: "a5",
    userId: "u4",
    userName: "John Mitchell",
    userAvatar: "JM",
    roleId: "designer",
    locationId: "dubai",
    levelId: "ic2",
    timestamp: "2026-01-08T09:30:00Z",
    action: "search",
  },
  {
    id: "a6",
    userId: "u2",
    userName: "Ahmed Al-Hassan",
    userAvatar: "AA",
    roleId: "swe-be",
    locationId: "jeddah",
    levelId: "ic3",
    timestamp: "2026-01-08T09:00:00Z",
    action: "search",
  },
];

// AI Insights
export const SAMPLE_INSIGHTS: Insight[] = [
  {
    id: "i1",
    type: "trend",
    title: "ML Engineer salaries surging",
    description: "ML Engineer compensation in Dubai has increased 18% YoY, outpacing all other engineering roles. Consider revising budget allocations.",
    metric: "+18% YoY",
    change: 18,
    priority: "high",
    relatedRoleId: "swe-ml",
    relatedLocationId: "dubai",
  },
  {
    id: "i2",
    type: "opportunity",
    title: "Riyadh offers 15% premium",
    description: "Software Engineers in Riyadh command a 15% premium over Dubai. Hiring remotely from UAE could reduce costs.",
    metric: "15% premium",
    change: 15,
    priority: "medium",
    relatedRoleId: "swe",
    relatedLocationId: "riyadh",
  },
  {
    id: "i3",
    type: "anomaly",
    title: "Data freshness alert",
    description: "QA Engineer data in Bahrain hasn't been updated in 45 days. Sample size may not reflect current market.",
    priority: "low",
    relatedRoleId: "qa",
    relatedLocationId: "manama",
  },
  {
    id: "i4",
    type: "risk",
    title: "Below-market offers detected",
    description: "3 recent offers for Senior Backend Engineers are 12% below P25. Risk of losing candidates to competitors.",
    metric: "-12% vs P25",
    change: -12,
    priority: "high",
    relatedRoleId: "swe-be",
    relatedLocationId: "dubai",
  },
  {
    id: "i5",
    type: "trend",
    title: "Product Manager demand rising",
    description: "PM roles in KSA seeing 25% more searches this month. Salary expectations likely to increase Q2.",
    metric: "+25% searches",
    change: 25,
    priority: "medium",
    relatedRoleId: "pm",
    relatedLocationId: "riyadh",
  },
];

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

