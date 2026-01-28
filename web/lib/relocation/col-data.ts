// Cost of Living Data for Relocation Calculator
// MVP: MENA focus + key global hubs (18 cities)
// Base index: 100 = Dubai as reference city

export type Region = "mena" | "europe" | "asia" | "americas";

export interface CostBreakdown {
  rent: number; // Monthly average in USD
  transport: number;
  food: number;
  utilities: number;
  other: number;
}

export interface City {
  id: string;
  name: string;
  country: string;
  region: Region;
  flag: string;
  colIndex: number; // Base 100 = Dubai
  breakdown: CostBreakdown;
  currency: string;
  currencySymbol: string;
}

// MVP Cities: MENA (10) + Global Hubs (8)
export const CITIES: City[] = [
  // MENA Region
  {
    id: "dubai",
    name: "Dubai",
    country: "UAE",
    region: "mena",
    flag: "🇦🇪",
    colIndex: 100,
    breakdown: { rent: 2500, transport: 300, food: 600, utilities: 200, other: 400 },
    currency: "AED",
    currencySymbol: "د.إ",
  },
  {
    id: "abu-dhabi",
    name: "Abu Dhabi",
    country: "UAE",
    region: "mena",
    flag: "🇦🇪",
    colIndex: 95,
    breakdown: { rent: 2200, transport: 280, food: 580, utilities: 190, other: 380 },
    currency: "AED",
    currencySymbol: "د.إ",
  },
  {
    id: "riyadh",
    name: "Riyadh",
    country: "Saudi Arabia",
    region: "mena",
    flag: "🇸🇦",
    colIndex: 85,
    breakdown: { rent: 1800, transport: 250, food: 500, utilities: 150, other: 350 },
    currency: "SAR",
    currencySymbol: "﷼",
  },
  {
    id: "jeddah",
    name: "Jeddah",
    country: "Saudi Arabia",
    region: "mena",
    flag: "🇸🇦",
    colIndex: 80,
    breakdown: { rent: 1600, transport: 230, food: 480, utilities: 140, other: 330 },
    currency: "SAR",
    currencySymbol: "﷼",
  },
  {
    id: "doha",
    name: "Doha",
    country: "Qatar",
    region: "mena",
    flag: "🇶🇦",
    colIndex: 105,
    breakdown: { rent: 2700, transport: 320, food: 620, utilities: 180, other: 420 },
    currency: "QAR",
    currencySymbol: "ر.ق",
  },
  {
    id: "kuwait-city",
    name: "Kuwait City",
    country: "Kuwait",
    region: "mena",
    flag: "🇰🇼",
    colIndex: 90,
    breakdown: { rent: 2000, transport: 270, food: 550, utilities: 160, other: 370 },
    currency: "KWD",
    currencySymbol: "د.ك",
  },
  {
    id: "manama",
    name: "Manama",
    country: "Bahrain",
    region: "mena",
    flag: "🇧🇭",
    colIndex: 82,
    breakdown: { rent: 1700, transport: 220, food: 500, utilities: 130, other: 340 },
    currency: "BHD",
    currencySymbol: ".د.ب",
  },
  {
    id: "muscat",
    name: "Muscat",
    country: "Oman",
    region: "mena",
    flag: "🇴🇲",
    colIndex: 78,
    breakdown: { rent: 1500, transport: 200, food: 450, utilities: 120, other: 320 },
    currency: "OMR",
    currencySymbol: "ر.ع.",
  },
  {
    id: "cairo",
    name: "Cairo",
    country: "Egypt",
    region: "mena",
    flag: "🇪🇬",
    colIndex: 45,
    breakdown: { rent: 600, transport: 80, food: 250, utilities: 50, other: 150 },
    currency: "EGP",
    currencySymbol: "£",
  },
  {
    id: "amman",
    name: "Amman",
    country: "Jordan",
    region: "mena",
    flag: "🇯🇴",
    colIndex: 55,
    breakdown: { rent: 800, transport: 120, food: 350, utilities: 80, other: 200 },
    currency: "JOD",
    currencySymbol: "د.ا",
  },

  // Global Hubs
  {
    id: "london",
    name: "London",
    country: "United Kingdom",
    region: "europe",
    flag: "🇬🇧",
    colIndex: 145,
    breakdown: { rent: 3500, transport: 450, food: 800, utilities: 250, other: 600 },
    currency: "GBP",
    currencySymbol: "£",
  },
  {
    id: "new-york",
    name: "New York",
    country: "United States",
    region: "americas",
    flag: "🇺🇸",
    colIndex: 160,
    breakdown: { rent: 4000, transport: 400, food: 900, utilities: 200, other: 700 },
    currency: "USD",
    currencySymbol: "$",
  },
  {
    id: "san-francisco",
    name: "San Francisco",
    country: "United States",
    region: "americas",
    flag: "🇺🇸",
    colIndex: 170,
    breakdown: { rent: 4500, transport: 350, food: 850, utilities: 180, other: 650 },
    currency: "USD",
    currencySymbol: "$",
  },
  {
    id: "singapore",
    name: "Singapore",
    country: "Singapore",
    region: "asia",
    flag: "🇸🇬",
    colIndex: 130,
    breakdown: { rent: 3200, transport: 200, food: 700, utilities: 150, other: 550 },
    currency: "SGD",
    currencySymbol: "S$",
  },
  {
    id: "hong-kong",
    name: "Hong Kong",
    country: "Hong Kong",
    region: "asia",
    flag: "🇭🇰",
    colIndex: 140,
    breakdown: { rent: 3800, transport: 180, food: 650, utilities: 140, other: 500 },
    currency: "HKD",
    currencySymbol: "HK$",
  },
  {
    id: "berlin",
    name: "Berlin",
    country: "Germany",
    region: "europe",
    flag: "🇩🇪",
    colIndex: 95,
    breakdown: { rent: 1800, transport: 280, food: 550, utilities: 200, other: 400 },
    currency: "EUR",
    currencySymbol: "€",
  },
  {
    id: "amsterdam",
    name: "Amsterdam",
    country: "Netherlands",
    region: "europe",
    flag: "🇳🇱",
    colIndex: 115,
    breakdown: { rent: 2400, transport: 250, food: 600, utilities: 180, other: 450 },
    currency: "EUR",
    currencySymbol: "€",
  },
  {
    id: "sydney",
    name: "Sydney",
    country: "Australia",
    region: "asia",
    flag: "🇦🇺",
    colIndex: 125,
    breakdown: { rent: 2800, transport: 350, food: 700, utilities: 200, other: 500 },
    currency: "AUD",
    currencySymbol: "A$",
  },
];

// Helper functions
export function getCity(cityId: string): City | undefined {
  return CITIES.find((c) => c.id === cityId);
}

export function getCitiesByRegion(region: Region): City[] {
  return CITIES.filter((c) => c.region === region);
}

export function searchCities(query: string): City[] {
  const q = query.toLowerCase().trim();
  if (!q) return CITIES;
  return CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q)
  );
}

export function getTotalMonthlyCost(breakdown: CostBreakdown): number {
  return breakdown.rent + breakdown.transport + breakdown.food + breakdown.utilities + breakdown.other;
}

// Region labels for UI
export const REGION_LABELS: Record<Region, string> = {
  mena: "Middle East & North Africa",
  europe: "Europe",
  asia: "Asia Pacific",
  americas: "Americas",
};
