import { createOdsAdapter } from "./factory";

export const omanNcsiWagesAdapter = createOdsAdapter({
  slug: "oman_ncsi_wages",
  endpoint:
    "https://data.ncsi.gov.om/api/explore/v2.1/catalog/datasets/wages-and-salaries/records",
  location: "Muscat",
  currency: "OMR",
  roleFields: ["industry", "activity", "sector", "occupation"],
  valueFields: ["value", "average_wage", "wages", "salary"],
  yearFields: ["year"],
  minYear: 2018,
  annualMultiplier: 12,
  sampleSize: 30,
  defaultRole: "Data Analyst",
});
