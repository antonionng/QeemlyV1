import { createOdsAdapter } from "./factory";

export const bahrainLaborMarketAdapter = createOdsAdapter({
  slug: "bahrain_labor_market",
  endpoint:
    "https://www.data.gov.bh/api/explore/v2.1/catalog/datasets/labour-market-regulatory-authority-statistics/records",
  location: "Manama",
  currency: "BHD",
  roleFields: ["economic_activity", "industry", "sector", "occupation"],
  valueFields: ["value", "average_wage", "wages", "salary"],
  yearFields: ["year"],
  minYear: 2018,
  annualMultiplier: 12,
  sampleSize: 30,
  defaultRole: "Data Analyst",
});
