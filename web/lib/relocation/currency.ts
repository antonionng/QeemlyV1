const AED_PER_UNIT: Record<string, number> = {
  AED: 1,
  AUD: 2.39,
  BHD: 9.74,
  CAD: 2.7,
  EGP: 0.074,
  EUR: 3.98,
  GBP: 4.65,
  HKD: 0.47,
  INR: 0.044,
  JOD: 5.18,
  JPY: 0.024,
  KWD: 11.94,
  OMR: 9.53,
  QAR: 1.01,
  SAR: 0.98,
  SGD: 2.72,
  USD: 3.67,
};

const LOCALE_BY_CURRENCY: Record<string, string> = {
  AED: "en-AE",
  AUD: "en-AU",
  BHD: "en-BH",
  CAD: "en-CA",
  EGP: "en-EG",
  EUR: "de-DE",
  GBP: "en-GB",
  HKD: "en-HK",
  INR: "en-IN",
  JOD: "en-JO",
  JPY: "ja-JP",
  KWD: "en-KW",
  OMR: "en-OM",
  QAR: "en-QA",
  SAR: "en-SA",
  SGD: "en-SG",
  USD: "en-US",
};

type FormatOptions = {
  compact?: boolean;
};

export function convertRelocationCurrency(
  amount: number,
  fromCurrency: string | null | undefined,
  toCurrency: string | null | undefined,
): number {
  if (!Number.isFinite(amount)) return 0;
  if (!fromCurrency || !toCurrency || fromCurrency === toCurrency) return amount;

  const fromRate = AED_PER_UNIT[fromCurrency];
  const toRate = AED_PER_UNIT[toCurrency];
  if (!fromRate || !toRate) return amount;

  const amountInAed = amount * fromRate;
  return amountInAed / toRate;
}

export function formatRelocationCurrency(
  amount: number,
  currencyCode: string | null | undefined,
  options: FormatOptions = {},
): string {
  const notation = options.compact ? "compact" : "standard";
  if (!currencyCode) {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
      notation,
    })
      .format(amount)
      .replace("K", "k");
  }

  return new Intl.NumberFormat(LOCALE_BY_CURRENCY[currencyCode] ?? "en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
    notation,
  })
    .format(amount)
    .replace("K", "k");
}

export function buildRelocationDisplayMoney(
  amount: number,
  currencyCode: string | null | undefined,
  options: FormatOptions = {},
) {
  if (!currencyCode) {
    return {
      primary: formatRelocationCurrency(amount, null, options),
      secondaryAed: null,
      aedValue: null,
    };
  }

  const aedValue = convertRelocationCurrency(amount, currencyCode, "AED");
  return {
    primary: formatRelocationCurrency(amount, currencyCode, options),
    secondaryAed: formatRelocationCurrency(aedValue, "AED", options),
    aedValue,
  };
}
