import { createOdsAdapter } from "./factory";

export const omanLabourPrivateAdapter = createOdsAdapter({
  slug: "oman_labour_private",
  endpoint:
    "https://data.gov.om/api/explore/v2.1/catalog/datasets/labour-market-private-sector/records",
  location: "Muscat",
  currency: "OMR",
  roleFields: ["industry", "activity", "sector", "occupation"],
  valueFields: ["avg_wage", "value", "salary", "monthly_wage"],
  yearFields: ["year"],
  minYear: 2018,
  annualMultiplier: 12,
  sampleSize: 30,
  defaultRole: "Software Engineer",
});
