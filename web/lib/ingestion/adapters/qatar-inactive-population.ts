import { createOdsAdapter } from "./factory";

export const qatarInactivePopulationAdapter = createOdsAdapter({
  slug: "qatar_inactive_population",
  endpoint:
    "https://www.data.gov.qa/api/explore/v2.1/catalog/datasets/labor-force-statistics-number-of-economically-inactive-population-aged-15-years-and-above-by-quarter/records",
  location: "Doha",
  currency: "QAR",
  roleFields: ["age_group", "sector", "category", "activity"],
  valueFields: ["value", "count", "population"],
  yearFields: ["year", "quarter"],
  minYear: 2019,
  annualMultiplier: 150,
  sampleSize: 30,
  defaultRole: "Data Analyst",
});
