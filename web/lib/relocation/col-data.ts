// Cost of Living Data for Relocation Calculator
// focus: GCC markets + major global tech hubs
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

// GCC cities, nearby MENA markets, and global tech hubs
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

  // Europe
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
    id: "manchester",
    name: "Manchester",
    country: "United Kingdom",
    region: "europe",
    flag: "🇬🇧",
    colIndex: 98,
    breakdown: { rent: 7000, transport: 900, food: 1950, utilities: 700, other: 1450 },
    currency: "GBP",
    currencySymbol: "£",
  },
  {
    id: "dublin",
    name: "Dublin",
    country: "Ireland",
    region: "europe",
    flag: "🇮🇪",
    colIndex: 125,
    breakdown: { rent: 11200, transport: 950, food: 2550, utilities: 850, other: 1800 },
    currency: "EUR",
    currencySymbol: "€",
  },
  {
    id: "amsterdam",
    name: "Amsterdam",
    country: "Netherlands",
    region: "europe",
    flag: "🇳🇱",
    colIndex: 118,
    breakdown: { rent: 9800, transport: 850, food: 2350, utilities: 780, other: 1650 },
    currency: "EUR",
    currencySymbol: "€",
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
  {
    id: "paris",
    name: "Paris",
    country: "France",
    region: "europe",
    flag: "🇫🇷",
    colIndex: 122,
    breakdown: { rent: 10400, transport: 800, food: 2400, utilities: 800, other: 1750 },
    currency: "EUR",
    currencySymbol: "€",
  },
  {
    id: "barcelona",
    name: "Barcelona",
    country: "Spain",
    region: "europe",
    flag: "🇪🇸",
    colIndex: 92,
    breakdown: { rent: 6900, transport: 650, food: 1950, utilities: 680, other: 1350 },
    currency: "EUR",
    currencySymbol: "€",
  },

  // Americas
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
    id: "san-francisco",
    name: "San Francisco",
    country: "United States",
    region: "americas",
    flag: "🇺🇸",
    colIndex: 168,
    breakdown: { rent: 15500, transport: 1000, food: 3350, utilities: 780, other: 2700 },
    currency: "USD",
    currencySymbol: "$",
  },
  {
    id: "seattle",
    name: "Seattle",
    country: "United States",
    region: "americas",
    flag: "🇺🇸",
    colIndex: 126,
    breakdown: { rent: 11000, transport: 900, food: 2550, utilities: 720, other: 1850 },
    currency: "USD",
    currencySymbol: "$",
  },
  {
    id: "austin",
    name: "Austin",
    country: "United States",
    region: "americas",
    flag: "🇺🇸",
    colIndex: 112,
    breakdown: { rent: 9000, transport: 1100, food: 2350, utilities: 780, other: 1600 },
    currency: "USD",
    currencySymbol: "$",
  },
  {
    id: "toronto",
    name: "Toronto",
    country: "Canada",
    region: "americas",
    flag: "🇨🇦",
    colIndex: 120,
    breakdown: { rent: 10100, transport: 900, food: 2450, utilities: 760, other: 1700 },
    currency: "CAD",
    currencySymbol: "C$",
  },
  {
    id: "vancouver",
    name: "Vancouver",
    country: "Canada",
    region: "americas",
    flag: "🇨🇦",
    colIndex: 123,
    breakdown: { rent: 10400, transport: 820, food: 2400, utilities: 740, other: 1750 },
    currency: "CAD",
    currencySymbol: "C$",
  },

  // Asia Pacific
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
    id: "bengaluru",
    name: "Bengaluru",
    country: "India",
    region: "asia",
    flag: "🇮🇳",
    colIndex: 58,
    breakdown: { rent: 3200, transport: 500, food: 1150, utilities: 280, other: 800 },
    currency: "INR",
    currencySymbol: "₹",
  },
  {
    id: "mumbai",
    name: "Mumbai",
    country: "India",
    region: "asia",
    flag: "🇮🇳",
    colIndex: 72,
    breakdown: { rent: 4500, transport: 600, food: 1450, utilities: 350, other: 1000 },
    currency: "INR",
    currencySymbol: "₹",
  },
  {
    id: "hyderabad",
    name: "Hyderabad",
    country: "India",
    region: "asia",
    flag: "🇮🇳",
    colIndex: 54,
    breakdown: { rent: 2900, transport: 450, food: 1050, utilities: 250, other: 700 },
    currency: "INR",
    currencySymbol: "₹",
  },
  {
    id: "pune",
    name: "Pune",
    country: "India",
    region: "asia",
    flag: "🇮🇳",
    colIndex: 52,
    breakdown: { rent: 2700, transport: 420, food: 1000, utilities: 240, other: 650 },
    currency: "INR",
    currencySymbol: "₹",
  },
  {
    id: "hong-kong",
    name: "Hong Kong",
    country: "Hong Kong",
    region: "asia",
    flag: "🇭🇰",
    colIndex: 140,
    breakdown: { rent: 12600, transport: 700, food: 2700, utilities: 620, other: 2100 },
    currency: "HKD",
    currencySymbol: "HK$",
  },
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    region: "asia",
    flag: "🇯🇵",
    colIndex: 128,
    breakdown: { rent: 9600, transport: 850, food: 2600, utilities: 700, other: 1900 },
    currency: "JPY",
    currencySymbol: "¥",
  },
  {
    id: "sydney",
    name: "Sydney",
    country: "Australia",
    region: "asia",
    flag: "🇦🇺",
    colIndex: 132,
    breakdown: { rent: 11600, transport: 900, food: 2550, utilities: 820, other: 2050 },
    currency: "AUD",
    currencySymbol: "A$",
  },
  {
    id: "melbourne",
    name: "Melbourne",
    country: "Australia",
    region: "asia",
    flag: "🇦🇺",
    colIndex: 118,
    breakdown: { rent: 9800, transport: 850, food: 2400, utilities: 780, other: 1800 },
    currency: "AUD",
    currencySymbol: "A$",
  },
];

// Helper functions
let runtimeCities: City[] | null = null;

export function setRelocationCities(cities: City[]) {
  runtimeCities = cities;
}

export function getRelocationCities(): City[] {
  return runtimeCities && runtimeCities.length > 0 ? runtimeCities : CITIES;
}

export function getCity(cityId: string): City | undefined {
  return getRelocationCities().find((c) => c.id === cityId);
}

export function getCitiesByRegion(region: Region): City[] {
  return getRelocationCities().filter((c) => c.region === region);
}

export function searchCities(query: string): City[] {
  const q = query.toLowerCase().trim();
  if (!q) return getRelocationCities();
  return getRelocationCities().filter(
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
  mena: "Middle East & North Africa",
  europe: "Europe",
  asia: "Asia Pacific",
  americas: "Americas",
};

