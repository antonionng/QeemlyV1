// Relocation Calculator Logic
// Calculates CoL adjustments, purchasing power, and recommended salary ranges

import { City, CostBreakdown, getCity, getTotalMonthlyCost } from "./col-data";

export type CompApproach = "local" | "purchasing-power" | "hybrid";

export interface RelocationInputs {
  homeCityId: string;
  targetCityId: string;
  baseSalary: number; // Annual salary in home currency (converted to AED for calc)
  compApproach: CompApproach;
  hybridCap?: number; // Percentage cap for hybrid approach (e.g., 120 = 120%)
  rentOverride?: number; // Optional manual rent override for target city
}

export interface RelocationResult {
  homeCity: City;
  targetCity: City;
  colRatio: number; // Target CoL / Home CoL
  baseSalary: number;
  purchasingPowerSalary: number; // Salary needed to maintain same purchasing power
  localMarketSalary: number; // What local market pays for same role
  recommendedSalary: number; // Based on comp approach
  recommendedRange: { min: number; max: number };
  costBreakdown: {
    home: CostBreakdown;
    target: CostBreakdown;
    targetWithOverride?: CostBreakdown;
  };
  monthlyDifference: number; // Difference in monthly living costs
  annualDifference: number; // Difference in annual living costs
}

/**
 * Calculate relocation compensation adjustment
 */
export function calculateRelocation(inputs: RelocationInputs): RelocationResult | null {
  const homeCity = getCity(inputs.homeCityId);
  const targetCity = getCity(inputs.targetCityId);

  if (!homeCity || !targetCity) {
    return null;
  }

  // Calculate Cost of Living ratio
  const colRatio = targetCity.colIndex / homeCity.colIndex;

  // Calculate purchasing power equivalent salary
  // If target is more expensive, salary needs to be higher
  const purchasingPowerSalary = Math.round(inputs.baseSalary * colRatio);

  // Local market salary is the base salary adjusted by CoL
  // (In a real app, this would come from benchmark data)
  const localMarketSalary = Math.round(inputs.baseSalary * colRatio);

  // Calculate recommended salary based on approach
  let recommendedSalary: number;

  switch (inputs.compApproach) {
    case "local":
      // Pay what the local market pays
      recommendedSalary = localMarketSalary;
      break;

    case "purchasing-power":
      // Maintain purchasing power
      recommendedSalary = purchasingPowerSalary;
      break;

    case "hybrid":
      // Cap the adjustment at a percentage
      const cap = (inputs.hybridCap ?? 100) / 100;
      const maxSalary = inputs.baseSalary * cap;
      recommendedSalary = Math.min(purchasingPowerSalary, maxSalary);
      break;

    default:
      recommendedSalary = purchasingPowerSalary;
  }

  // Calculate range (±5% of recommended)
  const rangeBuffer = 0.05;
  const recommendedRange = {
    min: Math.round(recommendedSalary * (1 - rangeBuffer)),
    max: Math.round(recommendedSalary * (1 + rangeBuffer)),
  };

  // Calculate cost breakdowns
  let targetBreakdown = { ...targetCity.breakdown };
  let targetWithOverride: CostBreakdown | undefined;

  if (inputs.rentOverride !== undefined && inputs.rentOverride > 0) {
    targetWithOverride = {
      ...targetCity.breakdown,
      rent: inputs.rentOverride,
    };
  }

  const homeMonthlyCost = getTotalMonthlyCost(homeCity.breakdown);
  const targetMonthlyCost = getTotalMonthlyCost(
    targetWithOverride ?? targetBreakdown
  );
  const monthlyDifference = targetMonthlyCost - homeMonthlyCost;
  const annualDifference = monthlyDifference * 12;

  return {
    homeCity,
    targetCity,
    colRatio,
    baseSalary: inputs.baseSalary,
    purchasingPowerSalary,
    localMarketSalary,
    recommendedSalary,
    recommendedRange,
    costBreakdown: {
      home: homeCity.breakdown,
      target: targetBreakdown,
      targetWithOverride,
    },
    monthlyDifference,
    annualDifference,
  };
}

/**
 * Format currency for display (Default to AED for GCC context)
 */
export function formatCurrency(amount: number, compact = false): string {
  if (compact) {
    if (amount >= 1000000) {
      return `AED ${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `AED ${(amount / 1000).toFixed(0)}K`;
    }
  }
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, showSign = false): string {
  const formatted = `${Math.abs(value).toFixed(0)}%`;
  if (showSign && value !== 0) {
    return value > 0 ? `+${formatted}` : `-${formatted}`;
  }
  return formatted;
}

/**
 * Get comparison text (e.g., "20% more expensive")
 */
export function getComparisonText(colRatio: number): string {
  const diff = (colRatio - 1) * 100;
  if (Math.abs(diff) < 2) {
    return "about the same cost";
  }
  if (diff > 0) {
    return `${Math.round(diff)}% more expensive`;
  }
  return `${Math.round(Math.abs(diff))}% less expensive`;
}

/**
 * Get recommendation explanation based on approach
 */
export function getApproachExplanation(approach: CompApproach, hybridCap?: number): string {
  switch (approach) {
    case "local":
      return "This approach pays the target market rate, regardless of where the employee is coming from. Best for companies with location-based pay bands.";
    case "purchasing-power":
      return "This approach adjusts salary to maintain the same purchasing power in the new location. Best for retaining talent and ensuring quality of life.";
    case "hybrid":
      return `This approach adjusts for purchasing power but caps the increase at ${hybridCap ?? 100}% of the original salary. Balances fairness with budget constraints.`;
    default:
      return "";
  }
}
