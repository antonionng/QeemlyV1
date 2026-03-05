import { createOdsAdapter } from "./factory";

export const saudiGastatLaborAdapter = createOdsAdapter({
  slug: "saudi_gastat_labor",
  endpoint:
    "https://economics.stats.gov.sa/api/explore/v2.1/catalog/datasets/labor-market-indicators/records",
  location: "Riyadh",
  currency: "SAR",
  roleFields: ["indicator", "activity", "sector", "occupation"],
  valueFields: ["value", "average_wage", "salary"],
  yearFields: ["year", "period"],
  minYear: 2018,
  annualMultiplier: 12,
  sampleSize: 42,
  defaultRole: "Product Manager",
});
