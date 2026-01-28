// Cost of Living Data for Relocation Calculator
// focus: GCC markets + key global hubs
// Base index: 100 = Dubai as reference city
// All breakdown values are in AED (indicative)

export type Region = "gcc" | "mena" | "europe" | "asia" | "americas";

export interface CostBreakdown {
  rent: number; // Monthly average in AED
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

// GCC Cities (Primary) + Global Hubs
export const CITIES: City[] = [
  // GCC Region
  {
    id: "dubai",
    name: "Dubai",
    country: "UAE",
    region: "gcc",
    flag: "🇦🇪",
    colIndex: 100,
    breakdown: { rent: 9000, transport: 1100, food: 2200, utilities: 750, other: 1500 },
    currency: "AED",
    currencySymbol: "د.إ",
  },
  {
    id: "abu-dhabi",
    name: "Abu Dhabi",
    country: "UAE",
    region: "gcc",
    flag: "🇦🇪",
    colIndex: 95,
    breakdown: { rent: 8200, transport: 1000, food: 2100, utilities: 700, other: 1400 },
    currency: "AED",
    currencySymbol: "د.إ",
  },
  {
    id: "riyadh",
    name: "Riyadh",
    country: "Saudi Arabia",
    region: "gcc",
    flag: "🇸🇦",
    colIndex: 85,
    breakdown: { rent: 6500, transport: 900, food: 1800, utilities: 550, other: 1300 },
    currency: "SAR",
    currencySymbol: "﷼",
  },
  {
    id: "jeddah",
    name: "Jeddah",
    country: "Saudi Arabia",
    region: "gcc",
    flag: "🇸🇦",
    colIndex: 80,
    breakdown: { rent: 5800, transport: 850, food: 1750, utilities: 500, other: 1200 },
    currency: "SAR",
    currencySymbol: "﷼",
  },
  {
    id: "doha",
    name: "Doha",
    country: "Qatar",
    region: "gcc",
    flag: "🇶🇦",
    colIndex: 105,
    breakdown: { rent: 9800, transport: 1200, food: 2300, utilities: 650, other: 1600 },
    currency: "QAR",
    currencySymbol: "ر.ق",
  },
  {
    id: "kuwait-city",
    name: "Kuwait City",
    country: "Kuwait",
    region: "gcc",
    flag: "🇰🇼",
    colIndex: 90,
    breakdown: { rent: 7300, transport: 1000, food: 2000, utilities: 600, other: 1400 },
    currency: "KWD",
    currencySymbol: "د.ك",
  },
  {
    id: "manama",
    name: "Manama",
    country: "Bahrain",
    region: "gcc",
    flag: "🇧🇭",
    colIndex: 82,
    breakdown: { rent: 6200, transport: 800, food: 1850, utilities: 500, other: 1250 },
    currency: "BHD",
    currencySymbol: ".د.ب",
  },
  {
    id: "muscat",
    name: "Muscat",
    country: "Oman",
    region: "gcc",
    flag: "🇴🇲",
    colIndex: 78,
    breakdown: { rent: 5500, transport: 750, food: 1650, utilities: 450, other: 1100 },
    currency: "OMR",
    currencySymbol: "ر.ع.",
  },

  // MENA (Other)
  {
    id: "cairo",
    name: "Cairo",
    country: "Egypt",
    region: "mena",
    flag: "🇪🇬",
    colIndex: 45,
    breakdown: { rent: 2200, transport: 300, food: 900, utilities: 200, other: 550 },
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
    breakdown: { rent: 3000, transport: 450, food: 1300, utilities: 300, other: 750 },
    currency: "JOD",
    currencySymbol: "د.ا",
  },

  // Global Hubs (Reference for Relocation)
  {
    id: "london",
    name: "London",
    country: "United Kingdom",
    region: "europe",
    flag: "🇬🇧",
    colIndex: 145,
    breakdown: { rent: 12800, transport: 1650, food: 2900, utilities: 900, other: 2200 },
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
    breakdown: { rent: 14700, transport: 1450, food: 3300, utilities: 750, other: 2600 },
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
    breakdown: { rent: 11700, transport: 750, food: 2550, utilities: 550, other: 2000 },
    currency: "SGD",
    currencySymbol: "S$",
  },
  {
    id: "berlin",
    name: "Berlin",
    country: "Germany",
    region: "europe",
    flag: "🇩🇪",
    colIndex: 95,
    breakdown: { rent: 6600, transport: 1000, food: 2000, utilities: 750, other: 1500 },
    currency: "EUR",
    currencySymbol: "€",
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
  gcc: "Gulf Cooperation Council",
  mena: "Other Middle East",
  europe: "Europe",
  asia: "Asia Pacific",
  americas: "Americas",
};

