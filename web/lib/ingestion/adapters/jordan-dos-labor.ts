import { createOdsAdapter } from "./factory";

export const jordanDosLaborAdapter = createOdsAdapter({
  slug: "jordan_dos_labor",
  endpoint:
    "https://opendata.dos.gov.jo/api/explore/v2.1/catalog/datasets/labour-market-statistics/records",
  location: "Dubai",
  currency: "AED",
  roleFields: ["industry", "activity", "occupation", "sector"],
  valueFields: ["value", "average_wage", "salary"],
  yearFields: ["year"],
  minYear: 2018,
  annualMultiplier: 12,
  sampleSize: 25,
  defaultRole: "Data Analyst",
});
