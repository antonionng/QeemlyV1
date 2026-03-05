import { createOdsAdapter } from "./factory";

export const qatarLaborForceSectorAdapter = createOdsAdapter({
  slug: "qatar_labor_force_sector",
  endpoint:
    "https://www.data.gov.qa/api/explore/v2.1/catalog/datasets/number-of-labor-force-by-sector-thousand/records",
  location: "Doha",
  currency: "QAR",
  roleFields: ["sector", "economic_activity", "activity", "category"],
  valueFields: ["value", "count", "labor_force"],
  yearFields: ["year"],
  minYear: 2018,
  annualMultiplier: 12000,
  sampleSize: 45,
  defaultRole: "Software Engineer",
});
