// Currency formatting utilities with company settings integration

import { useCompanySettings, CURRENCIES } from "@/lib/company";

// Currency conversion rates (relative to USD)
// In production, these would come from an API
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  GBP: 0.79,
  EUR: 0.92,
  AED: 3.67,
  SAR: 3.75,
};

// Monthly to annual conversion
const MONTHLY_TO_ANNUAL = 12;

export interface CurrencyFormatOptions {
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
  notation?: "standard" | "compact";
  showCurrency?: boolean;
}

/**
 * Get currency symbol from currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  const currency = CURRENCIES.find((c) => c.value === currencyCode);
  return currency?.symbol || currencyCode;
}

/**
 * Get locale for currency formatting
 */
function getLocaleForCurrency(currencyCode: string): string {
  switch (currencyCode) {
    case "GBP":
      return "en-GB";
    case "EUR":
      return "de-DE";
    case "AED":
    case "SAR":
      return "ar-AE";
    default:
      return "en-US";
  }
}

/**
 * Format a value in a specific currency
 */
export function formatCurrency(
  value: number,
  currencyCode: string,
  options: CurrencyFormatOptions = {}
): string {
  const {
    maximumFractionDigits = 0,
    minimumFractionDigits = 0,
    notation = "standard",
    showCurrency = true,
  } = options;

  const locale = getLocaleForCurrency(currencyCode);

  if (showCurrency) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits,
      minimumFractionDigits,
      notation,
    }).format(value);
  }

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits,
    minimumFractionDigits,
    notation,
  }).format(value);
}

/**
 * Convert value from one currency to another
 */
export function convertCurrency(
  value: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) return value;

  const fromRate = EXCHANGE_RATES[fromCurrency] || 1;
  const toRate = EXCHANGE_RATES[toCurrency] || 1;

  // Convert to USD first, then to target currency
  const usdValue = value / fromRate;
  return usdValue * toRate;
}

/**
 * Convert monthly salary to annual
 */
export function monthlyToAnnual(value: number): number {
  return value * MONTHLY_TO_ANNUAL;
}

/**
 * Convert annual salary to monthly
 */
export function annualToMonthly(value: number): number {
  return value / MONTHLY_TO_ANNUAL;
}

/**
 * Hook for currency formatting using company default currency
 */
export function useCurrencyFormatter() {
  const companySettings = useCompanySettings();
  const defaultCurrency = companySettings.defaultCurrency;

  /**
   * Format a value in the company's default currency
   */
  const format = (value: number, options?: CurrencyFormatOptions): string => {
    return formatCurrency(value, defaultCurrency, options);
  };

  /**
   * Format a value with compact notation (e.g., 100K, 1.2M)
   */
  const formatCompact = (value: number): string => {
    return formatCurrency(value, defaultCurrency, { notation: "compact" });
  };

  /**
   * Convert a value from any currency to company's default currency
   */
  const convertToDefault = (value: number, fromCurrency: string): number => {
    return convertCurrency(value, fromCurrency, defaultCurrency);
  };

  /**
   * Convert monthly value to annual and format in default currency
   */
  const formatMonthlyAsAnnual = (
    monthlyValue: number,
    fromCurrency: string,
    options?: CurrencyFormatOptions
  ): string => {
    const annualValue = monthlyToAnnual(monthlyValue);
    const convertedValue = convertCurrency(annualValue, fromCurrency, defaultCurrency);
    return formatCurrency(convertedValue, defaultCurrency, options);
  };

  /**
   * Convert value from a source currency and format
   */
  const formatConverted = (
    value: number,
    fromCurrency: string,
    options?: CurrencyFormatOptions
  ): string => {
    const convertedValue = convertCurrency(value, fromCurrency, defaultCurrency);
    return formatCurrency(convertedValue, defaultCurrency, options);
  };

  return {
    defaultCurrency,
    symbol: getCurrencySymbol(defaultCurrency),
    format,
    formatCompact,
    formatConverted,
    formatMonthlyAsAnnual,
    convertToDefault,
  };
}

/**
 * Round to nearest thousand
 */
export function roundToThousand(value: number): number {
  return Math.round(value / 1000) * 1000;
}

/**
 * Round to nearest hundred
 */
export function roundToHundred(value: number): number {
  return Math.round(value / 100) * 100;
}
