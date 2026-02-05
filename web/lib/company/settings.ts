// Company Settings Store
// Manages company-level configuration with localStorage persistence

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { INDUSTRIES, COMPANY_SIZES } from "../dashboard/dummy-data";

// Types
export type FundingStage = 
  | "Pre-seed"
  | "Seed"
  | "Series A"
  | "Series B"
  | "Series C"
  | "Series D+"
  | "Public"
  | "Private Equity"
  | "Bootstrapped";

export type ReviewCycle = "monthly" | "quarterly" | "biannual" | "annual";

export type TargetPercentile = 25 | 50 | 75 | 90;

export type VestingSchedule = "4-year-1-cliff" | "4-year-no-cliff" | "3-year" | "5-year" | "custom" | "none";

export type BenefitsTier = "basic" | "standard" | "premium" | "custom";

export interface CompanySettings {
  // Company Profile
  companyName: string;
  companyLogo: string | null; // Base64 encoded logo or URL
  companyWebsite: string;
  companyDescription: string; // Tagline/description
  primaryColor: string; // Brand color hex
  industry: string;
  companySize: string;
  fundingStage: FundingStage;
  headquartersCountry: string;
  headquartersCity: string;
  
  // Compensation Defaults
  targetPercentile: TargetPercentile;
  reviewCycle: ReviewCycle;
  defaultCurrency: string;
  fiscalYearStart: number; // Month (1-12)
  defaultBonusPercentage: number | null; // Target bonus as % of base, null = no bonus
  equityVestingSchedule: VestingSchedule;
  benefitsTier: BenefitsTier;
  
  // Metadata
  lastUpdated: string;
  isConfigured: boolean;
}

export interface CompanySettingsStore extends CompanySettings {
  // Actions
  updateSettings: (settings: Partial<CompanySettings>) => void;
  resetSettings: () => void;
  markAsConfigured: () => void;
}

// Default settings
const DEFAULT_SETTINGS: CompanySettings = {
  // Company Profile
  companyName: "Your Company",
  companyLogo: null,
  companyWebsite: "",
  companyDescription: "",
  primaryColor: "#6366f1", // Default brand purple
  industry: INDUSTRIES[0],
  companySize: COMPANY_SIZES[2], // 201-500
  fundingStage: "Series B",
  headquartersCountry: "UAE",
  headquartersCity: "Dubai",
  // Compensation Defaults
  targetPercentile: 50,
  reviewCycle: "annual",
  defaultCurrency: "AED",
  fiscalYearStart: 1, // January
  defaultBonusPercentage: null, // No bonus by default
  equityVestingSchedule: "4-year-1-cliff",
  benefitsTier: "standard",
  // Metadata
  lastUpdated: new Date().toISOString(),
  isConfigured: false,
};

// Zustand store with localStorage persistence
export const useCompanySettings = create<CompanySettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      
      updateSettings: (newSettings) => set((state) => ({
        ...state,
        ...newSettings,
        lastUpdated: new Date().toISOString(),
      })),
      
      resetSettings: () => set({
        ...DEFAULT_SETTINGS,
        lastUpdated: new Date().toISOString(),
      }),
      
      markAsConfigured: () => set({ isConfigured: true }),
    }),
    {
      name: "qeemly:company-settings",
    }
  )
);

// Helper to get percentile label
export function getPercentileLabel(percentile: TargetPercentile): string {
  switch (percentile) {
    case 25: return "25th (Below Market)";
    case 50: return "50th (Market Median)";
    case 75: return "75th (Above Market)";
    case 90: return "90th (Premium)";
  }
}

// Options for dropdowns
export const FUNDING_STAGES: FundingStage[] = [
  "Pre-seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C",
  "Series D+",
  "Public",
  "Private Equity",
  "Bootstrapped",
];

export const REVIEW_CYCLES: { value: ReviewCycle; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "biannual", label: "Bi-annual" },
  { value: "annual", label: "Annual" },
];

export const TARGET_PERCENTILES: { value: TargetPercentile; label: string }[] = [
  { value: 25, label: "25th Percentile (Below Market)" },
  { value: 50, label: "50th Percentile (Market Median)" },
  { value: 75, label: "75th Percentile (Above Market)" },
  { value: 90, label: "90th Percentile (Premium)" },
];

export const CURRENCIES = [
  { value: "GBP", label: "GBP (£)", symbol: "£" },
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "AED", label: "AED (د.إ)", symbol: "د.إ" },
  { value: "SAR", label: "SAR (﷼)", symbol: "﷼" },
];

export const COUNTRIES = [
  { value: "United Kingdom", code: "GB", flag: "🇬🇧" },
  { value: "United States", code: "US", flag: "🇺🇸" },
  { value: "UAE", code: "AE", flag: "🇦🇪" },
  { value: "Saudi Arabia", code: "SA", flag: "🇸🇦" },
  { value: "Qatar", code: "QA", flag: "🇶🇦" },
  { value: "Germany", code: "DE", flag: "🇩🇪" },
  { value: "France", code: "FR", flag: "🇫🇷" },
  { value: "Netherlands", code: "NL", flag: "🇳🇱" },
  { value: "Ireland", code: "IE", flag: "🇮🇪" },
  { value: "Singapore", code: "SG", flag: "🇸🇬" },
];

export const VESTING_SCHEDULES: { value: VestingSchedule; label: string; description: string }[] = [
  { value: "4-year-1-cliff", label: "4 Years (1 Year Cliff)", description: "Standard startup vesting" },
  { value: "4-year-no-cliff", label: "4 Years (No Cliff)", description: "Monthly vesting from day one" },
  { value: "3-year", label: "3 Years", description: "Accelerated vesting" },
  { value: "5-year", label: "5 Years", description: "Extended vesting period" },
  { value: "custom", label: "Custom", description: "Custom vesting schedule" },
  { value: "none", label: "No Equity", description: "No equity grants" },
];

export const BENEFITS_TIERS: { value: BenefitsTier; label: string; description: string }[] = [
  { value: "basic", label: "Basic", description: "Essential benefits only" },
  { value: "standard", label: "Standard", description: "Comprehensive package" },
  { value: "premium", label: "Premium", description: "Top-tier benefits" },
  { value: "custom", label: "Custom", description: "Custom benefits package" },
];

export const FISCAL_MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

// Helper to get company initials from name
export function getCompanyInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
