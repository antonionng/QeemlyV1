// Mock employee data for Company Overview and Salary Review
// This simulates a company with 150 employees across departments

import { LOCATIONS, LEVELS, ROLES, type Location, type Level, type Role, generateBenchmark } from "../dashboard/dummy-data";

// Types
export type Department = 
  | "Engineering"
  | "Product"
  | "Design"
  | "Data"
  | "Sales"
  | "Marketing"
  | "Operations"
  | "Finance"
  | "HR";

export type BandPosition = "below" | "in-band" | "above";

export type EmploymentType = "local" | "expat";

export type PerformanceRating = "low" | "meets" | "exceeds" | "exceptional";

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  department: Department;
  role: Role;
  level: Level;
  location: Location;
  status: "active" | "inactive";
  employmentType: EmploymentType;
  baseSalary: number;
  bonus?: number;
  equity?: number;
  totalComp: number;
  bandPosition: BandPosition;
  bandPercentile: number; // 0-100, where they sit in the band
  marketComparison: number; // % vs market median (-20 to +30)
  hireDate: Date;
  lastReviewDate?: Date;
  performanceRating?: PerformanceRating;
}

export interface DepartmentSummary {
  department: Department;
  headcount: number;
  activeCount: number;
  inBandCount: number;
  belowBandCount: number;
  aboveBandCount: number;
  totalPayroll: number;
  avgVsMarket: number; // % vs market
}

export interface TrendDataPoint {
  month: string;
  value: number;
}

export interface RiskBreakdownItem {
  severity: "critical" | "high" | "medium" | "low";
  count: number;
  label: string;
}

export interface CompanyMetrics {
  totalEmployees: number;
  activeEmployees: number;
  totalPayroll: number;
  inBandPercentage: number;
  outOfBandPercentage: number;
  avgMarketPosition: number;
  rolesOutsideBand: number;
  departmentsOverBenchmark: number;
  payrollRiskFlags: number;
  // Extended metrics for enhanced dashboard
  healthScore: number;
  headcountTrend: TrendDataPoint[];
  payrollTrend: TrendDataPoint[];
  riskBreakdown: RiskBreakdownItem[];
  bandDistribution: {
    below: number;
    inBand: number;
    above: number;
  };
  // YoY comparisons
  headcountChange: number; // percentage change YoY
  payrollChange: number; // percentage change YoY
  inBandChange: number; // percentage point change YoY
}

// First names pool
const FIRST_NAMES = [
  "James", "Emma", "Oliver", "Sophia", "William", "Isabella", "Benjamin", "Mia",
  "Lucas", "Charlotte", "Henry", "Amelia", "Alexander", "Harper", "Sebastian",
  "Evelyn", "Jack", "Abigail", "Aiden", "Emily", "Owen", "Elizabeth", "Samuel",
  "Sofia", "Ryan", "Avery", "Nathan", "Ella", "Caleb", "Scarlett", "Daniel",
  "Grace", "Matthew", "Chloe", "Joseph", "Victoria", "David", "Riley", "Andrew",
  "Aria", "Michael", "Lily", "Joshua", "Hannah", "Ethan", "Layla", "Anthony",
  "Zoe", "Thomas", "Nora", "Ahmed", "Fatima", "Mohammed", "Aisha", "Omar",
  "Sara", "Ali", "Leila", "Raj", "Priya", "Arjun", "Ananya", "Chen", "Wei",
  "Yuki", "Sakura", "Carlos", "Maria", "Pedro", "Ana", "John", "Sarah",
  "Robert", "Jennifer", "Christopher", "Linda", "Steven", "Barbara"
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen",
  "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera",
  "Campbell", "Mitchell", "Carter", "Roberts", "Al-Hassan", "Al-Farsi", "Khan",
  "Patel", "Singh", "Sharma", "Chen", "Wang", "Liu", "Zhang", "Tanaka",
  "Yamamoto", "Kim", "Park", "O'Brien", "Murphy", "Kelly", "Sullivan"
];

// Department distribution (roughly matches a tech company)
const DEPARTMENT_DISTRIBUTION: { dept: Department; weight: number; roles: string[] }[] = [
  { dept: "Engineering", weight: 40, roles: ["swe", "swe-fe", "swe-be", "swe-mobile", "swe-devops", "swe-data", "swe-ml", "security", "qa"] },
  { dept: "Product", weight: 12, roles: ["pm", "tpm"] },
  { dept: "Design", weight: 8, roles: ["designer", "ux-researcher"] },
  { dept: "Data", weight: 10, roles: ["data-scientist", "data-analyst", "swe-data"] },
  { dept: "Sales", weight: 10, roles: ["pm"] }, // Placeholder, reuses PM data
  { dept: "Marketing", weight: 8, roles: ["pm"] },
  { dept: "Operations", weight: 5, roles: ["pm"] },
  { dept: "Finance", weight: 4, roles: ["data-analyst"] },
  { dept: "HR", weight: 3, roles: ["pm"] },
];

// Level distribution (pyramid structure)
const LEVEL_WEIGHTS: Record<string, number> = {
  "ic1": 15,
  "ic2": 25,
  "ic3": 30,
  "ic4": 12,
  "ic5": 5,
  "m1": 8,
  "m2": 3,
  "d1": 1.5,
  "d2": 0.4,
  "vp": 0.1,
};

// Seed random for consistent data
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

function pickWeighted<T>(items: T[], weights: number[], random: () => number): T {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let r = random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function generateEmployees(count: number): Employee[] {
  const random = seededRandom(42); // Fixed seed for consistent data
  const employees: Employee[] = [];
  
  // We'll use UK as primary location for this mock company
  const ukLocation: Location = {
    id: "london",
    city: "London",
    country: "United Kingdom",
    countryCode: "GB",
    currency: "AED", // Keep AED for now, will convert to GBP in display
    flag: "GB"
  };
  
  const locations = [ukLocation, ...LOCATIONS.slice(0, 3)]; // UK + Dubai, Abu Dhabi, Riyadh
  const locationWeights = [70, 15, 10, 5]; // Mostly UK

  for (let i = 0; i < count; i++) {
    const firstName = FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(random() * LAST_NAMES.length)];
    
    // Pick department
    const deptInfo = pickWeighted(
      DEPARTMENT_DISTRIBUTION,
      DEPARTMENT_DISTRIBUTION.map(d => d.weight),
      random
    );
    
    // Pick role from department
    const roleId = deptInfo.roles[Math.floor(random() * deptInfo.roles.length)];
    const role = ROLES.find(r => r.id === roleId) || ROLES[0];
    
    // Pick level
    const levelIds = Object.keys(LEVEL_WEIGHTS);
    const levelId = pickWeighted(
      levelIds,
      levelIds.map(id => LEVEL_WEIGHTS[id]),
      random
    );
    const level = LEVELS.find(l => l.id === levelId) || LEVELS[2];
    
    // Pick location
    const location = pickWeighted(locations, locationWeights, random);
    
    // Generate salary based on market benchmark
    const benchmark = generateBenchmark(roleId, location.id === "london" ? "dubai" : location.id, levelId);
    const marketMedian = benchmark.percentiles.p50;
    
    // Generate position in band with realistic distribution
    // Most employees (60%) should be in-band, 25% below, 15% above
    const bandRoll = random();
    let bandPosition: BandPosition;
    let salaryMultiplier: number;
    let bandPercentile: number;
    
    if (bandRoll < 0.25) {
      bandPosition = "below";
      salaryMultiplier = 0.75 + random() * 0.15; // 75-90% of median
      bandPercentile = random() * 20; // 0-20
    } else if (bandRoll < 0.85) {
      bandPosition = "in-band";
      salaryMultiplier = 0.9 + random() * 0.2; // 90-110% of median
      bandPercentile = 20 + random() * 60; // 20-80
    } else {
      bandPosition = "above";
      salaryMultiplier = 1.1 + random() * 0.2; // 110-130% of median
      bandPercentile = 80 + random() * 20; // 80-100
    }
    
    // Convert from monthly AED to annual AED
    const baseSalary = Math.round((marketMedian * salaryMultiplier * 12) / 1000) * 1000;
    
    // Bonus (5-20% depending on level and performance)
    const bonusPercentage = 0.05 + (LEVELS.indexOf(level) / LEVELS.length) * 0.15;
    const bonus = Math.round(baseSalary * bonusPercentage);
    
    // Equity (only for senior levels)
    const equityEligible = ["ic4", "ic5", "m1", "m2", "d1", "d2", "vp"].includes(levelId);
    const equity = equityEligible ? Math.round(baseSalary * (0.1 + random() * 0.3)) : 0;
    
    const totalComp = baseSalary + bonus + equity;
    
    // Market comparison
    const marketComparison = Math.round((salaryMultiplier - 1) * 100);
    
    // Hire date (last 5 years)
    const hireDate = new Date();
    hireDate.setFullYear(hireDate.getFullYear() - Math.floor(random() * 5));
    hireDate.setMonth(Math.floor(random() * 12));
    hireDate.setDate(Math.floor(random() * 28) + 1);
    
    // Status (95% active)
    const status = random() > 0.05 ? "active" : "inactive";
    
    // Employment type
    const employmentType: EmploymentType = random() > 0.85 ? "expat" : "local";
    
    // Performance rating (only for employees with review)
    const hasReview = random() > 0.2;
    let performanceRating: PerformanceRating | undefined;
    if (hasReview) {
      const perfRoll = random();
      if (perfRoll < 0.1) performanceRating = "low";
      else if (perfRoll < 0.5) performanceRating = "meets";
      else if (perfRoll < 0.85) performanceRating = "exceeds";
      else performanceRating = "exceptional";
    }
    
    employees.push({
      id: `emp-${String(i + 1).padStart(4, "0")}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
      avatar: undefined,
      department: deptInfo.dept,
      role,
      level,
      location,
      status,
      employmentType,
      baseSalary,
      bonus,
      equity: equity > 0 ? equity : undefined,
      totalComp,
      bandPosition,
      bandPercentile: Math.round(bandPercentile),
      marketComparison,
      hireDate,
      lastReviewDate: hasReview ? new Date(Date.now() - random() * 180 * 24 * 60 * 60 * 1000) : undefined,
      performanceRating,
    });
  }
  
  return employees;
}

// Generate 150 employees
export const MOCK_EMPLOYEES: Employee[] = generateEmployees(150);

// Calculate department summaries
export function getDepartmentSummaries(): DepartmentSummary[] {
  const departments = [...new Set(MOCK_EMPLOYEES.map(e => e.department))];
  
  return departments.map(dept => {
    const deptEmployees = MOCK_EMPLOYEES.filter(e => e.department === dept);
    const activeEmployees = deptEmployees.filter(e => e.status === "active");
    
    const inBandCount = activeEmployees.filter(e => e.bandPosition === "in-band").length;
    const belowBandCount = activeEmployees.filter(e => e.bandPosition === "below").length;
    const aboveBandCount = activeEmployees.filter(e => e.bandPosition === "above").length;
    
    const totalPayroll = activeEmployees.reduce((sum, e) => sum + e.totalComp, 0);
    const avgVsMarket = activeEmployees.length > 0
      ? activeEmployees.reduce((sum, e) => sum + e.marketComparison, 0) / activeEmployees.length
      : 0;
    
    return {
      department: dept,
      headcount: deptEmployees.length,
      activeCount: activeEmployees.length,
      inBandCount,
      belowBandCount,
      aboveBandCount,
      totalPayroll,
      avgVsMarket: Math.round(avgVsMarket * 10) / 10,
    };
  }).sort((a, b) => b.activeCount - a.activeCount);
}

// Generate mock trend data for the past 12 months
function generateTrendData(baseValue: number, volatility: number, trend: number): TrendDataPoint[] {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonth = new Date().getMonth();
  const random = seededRandom(123); // Fixed seed for consistent data
  
  const data: TrendDataPoint[] = [];
  let value = baseValue * (1 - trend * 0.12); // Start 12 months ago
  
  for (let i = 0; i < 12; i++) {
    const monthIndex = (currentMonth - 11 + i + 12) % 12;
    const monthVariation = (random() - 0.5) * volatility * baseValue;
    value = value * (1 + trend / 12) + monthVariation;
    data.push({
      month: months[monthIndex],
      value: Math.round(value),
    });
  }
  
  return data;
}

// Calculate risk breakdown by severity
function calculateRiskBreakdown(employees: Employee[]): RiskBreakdownItem[] {
  const critical = employees.filter(e => e.marketComparison > 25).length;
  const high = employees.filter(e => e.marketComparison > 15 && e.marketComparison <= 25).length;
  const medium = employees.filter(e => e.marketComparison > 5 && e.marketComparison <= 15).length;
  const low = employees.filter(e => e.bandPosition === "above" && e.marketComparison <= 5).length;
  
  return [
    { severity: "critical", count: critical, label: "Critical (>25% above)" },
    { severity: "high", count: high, label: "High (15-25% above)" },
    { severity: "medium", count: medium, label: "Medium (5-15% above)" },
    { severity: "low", count: low, label: "Low (slightly above)" },
  ];
}

// Calculate overall compensation health score (0-100)
function calculateHealthScore(
  inBandPercentage: number,
  avgMarketPosition: number,
  payrollRiskFlags: number,
  totalEmployees: number
): number {
  // Weight factors
  const bandAlignmentScore = inBandPercentage; // 0-100 based on % in band
  
  // Market position score: ideal is 0-5% above market
  const marketScore = avgMarketPosition >= 0 && avgMarketPosition <= 5 
    ? 100 
    : avgMarketPosition < 0 
      ? Math.max(0, 100 + avgMarketPosition * 5) // Penalize being below market
      : Math.max(0, 100 - (avgMarketPosition - 5) * 3); // Penalize being too far above
  
  // Risk score: fewer risk flags = higher score
  const riskPercentage = (payrollRiskFlags / totalEmployees) * 100;
  const riskScore = Math.max(0, 100 - riskPercentage * 5);
  
  // Weighted average
  const score = (bandAlignmentScore * 0.4) + (marketScore * 0.35) + (riskScore * 0.25);
  
  return Math.round(Math.min(100, Math.max(0, score)));
}

// Calculate company-wide metrics
export function getCompanyMetrics(): CompanyMetrics {
  const activeEmployees = MOCK_EMPLOYEES.filter(e => e.status === "active");
  const totalPayroll = activeEmployees.reduce((sum, e) => sum + e.totalComp, 0);
  
  const inBandCount = activeEmployees.filter(e => e.bandPosition === "in-band").length;
  const belowBandCount = activeEmployees.filter(e => e.bandPosition === "below").length;
  const aboveBandCount = activeEmployees.filter(e => e.bandPosition === "above").length;
  const outOfBandCount = activeEmployees.length - inBandCount;
  
  const avgMarketPosition = activeEmployees.reduce((sum, e) => sum + e.marketComparison, 0) / activeEmployees.length;
  
  // Roles outside band = employees below or above band
  const rolesOutsideBand = outOfBandCount;
  
  // Departments over benchmark = departments with avg > 5%
  const deptSummaries = getDepartmentSummaries();
  const departmentsOverBenchmark = deptSummaries.filter(d => d.avgVsMarket > 5).length;
  
  // Payroll risk flags = employees significantly above band (>15% above market)
  const payrollRiskFlags = activeEmployees.filter(e => e.marketComparison > 15).length;
  
  const inBandPercentage = Math.round((inBandCount / activeEmployees.length) * 100);
  
  // Generate trend data
  const headcountTrend = generateTrendData(activeEmployees.length, 0.03, 0.08);
  const payrollTrend = generateTrendData(totalPayroll, 0.02, 0.12);
  
  // Calculate risk breakdown
  const riskBreakdown = calculateRiskBreakdown(activeEmployees);
  
  // Calculate health score
  const healthScore = calculateHealthScore(
    inBandPercentage,
    avgMarketPosition,
    payrollRiskFlags,
    activeEmployees.length
  );
  
  // Band distribution as percentages
  const bandDistribution = {
    below: Math.round((belowBandCount / activeEmployees.length) * 100),
    inBand: inBandPercentage,
    above: Math.round((aboveBandCount / activeEmployees.length) * 100),
  };
  
  return {
    totalEmployees: MOCK_EMPLOYEES.length,
    activeEmployees: activeEmployees.length,
    totalPayroll,
    inBandPercentage,
    outOfBandPercentage: Math.round((outOfBandCount / activeEmployees.length) * 100),
    avgMarketPosition: Math.round(avgMarketPosition * 10) / 10,
    rolesOutsideBand,
    departmentsOverBenchmark,
    payrollRiskFlags,
    // Extended metrics
    healthScore,
    headcountTrend,
    payrollTrend,
    riskBreakdown,
    bandDistribution,
    // Mock YoY changes
    headcountChange: 8.2,
    payrollChange: 12.4,
    inBandChange: 3.5,
  };
}

// Get employees by department
export function getEmployeesByDepartment(department: Department): Employee[] {
  return MOCK_EMPLOYEES.filter(e => e.department === department && e.status === "active");
}

// Get employees needing review attention
export function getEmployeesNeedingAttention(): Employee[] {
  return MOCK_EMPLOYEES.filter(e => 
    e.status === "active" && 
    (e.bandPosition !== "in-band" || 
     (e.performanceRating === "low" && e.marketComparison > 0) ||
     (e.performanceRating === "exceptional" && e.bandPercentile > 80))
  );
}

// Format currency for display (AED)
export function formatAED(amount: number): string {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format compact currency (e.g., AED 2.4M)
export function formatAEDCompact(amount: number): string {
  if (amount >= 1000000) {
    return `AED ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `AED ${(amount / 1000).toFixed(0)}k`;
  }
  return formatAED(amount);
}

// Legacy aliases for backwards compatibility - these now use AED
export const formatGBP = formatAED;
export const formatGBPCompact = formatAEDCompact;
