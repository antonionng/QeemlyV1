import { createOdsAdapter } from "./factory";

export const kuwaitOpenLaborAdapter = createOdsAdapter({
  slug: "kuwait_open_labor",
  endpoint:
    "https://e.gov.kw/api/explore/v2.1/catalog/datasets/labor-force-open-data/records",
  location: "Kuwait City",
  currency: "KWD",
  roleFields: ["occupation", "industry", "sector", "activity"],
  valueFields: ["value", "wage", "salary", "average_wage"],
  yearFields: ["year"],
  minYear: 2018,
  annualMultiplier: 12,
  sampleSize: 28,
  defaultRole: "Software Engineer",
});
