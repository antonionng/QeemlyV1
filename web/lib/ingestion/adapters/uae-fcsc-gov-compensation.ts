import { createOdsAdapter } from "./factory";

export const uaeFcscGovCompensationAdapter = createOdsAdapter({
  slug: "uae_fcsc_gov_compensation",
  endpoint:
    "https://opendata.fcsc.gov.ae/api/explore/v2.1/catalog/datasets/general-government-compensation-of-employees/records",
  location: "Dubai",
  currency: "AED",
  roleFields: ["category", "sector", "activity", "occupation"],
  valueFields: ["compensation", "wages", "value", "amount"],
  yearFields: ["year"],
  minYear: 2018,
  annualMultiplier: 12,
  sampleSize: 30,
  defaultRole: "Data Analyst",
});
