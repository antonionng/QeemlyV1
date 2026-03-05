import { createOdsAdapter } from "./factory";

export const bahrainLmraWorkPermitsAdapter = createOdsAdapter({
  slug: "bahrain_lmra_work_permits",
  endpoint:
    "https://www.data.gov.bh/api/explore/v2.1/catalog/datasets/lmra1-active-work-permits-for-expatriate/records",
  location: "Manama",
  currency: "BHD",
  roleFields: ["sector", "occupation", "nationality", "category"],
  valueFields: ["value", "count", "permits"],
  yearFields: ["year"],
  minYear: 2018,
  annualMultiplier: 260,
  sampleSize: 25,
  defaultRole: "DevOps Engineer",
});
