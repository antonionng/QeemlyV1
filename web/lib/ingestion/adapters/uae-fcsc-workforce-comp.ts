import { createOdsAdapter } from "./factory";

export const uaeFcscWorkforceCompAdapter = createOdsAdapter({
  slug: "uae_fcsc_workforce_comp",
  endpoint:
    "https://www.dubaipulse.gov.ae/api/explore/v2.1/catalog/datasets/dsc_workforce_compensation-open-api/records",
  location: "Dubai",
  currency: "AED",
  roleFields: ["activity", "economic_activity", "sector", "occupation"],
  valueFields: ["value", "avg_monthly_wage", "compensation", "salary"],
  yearFields: ["year"],
  minYear: 2019,
  annualMultiplier: 12,
  sampleSize: 40,
  defaultRole: "Software Engineer",
  locationVariants: [
    { location: "Dubai", multiplier: 1 },
    { location: "Abu Dhabi", multiplier: 1.04 },
  ],
});
