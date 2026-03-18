import { createOdsAdapter } from "./factory";

export const uaeFcscPublicAdminPaidAdapter = createOdsAdapter({
  slug: "uae_fcsc_public_admin_paid",
  endpoint:
    "https://opendata.fcsc.gov.ae/api/explore/v2.1/catalog/datasets/paid-employees-public-administration-defense-and-compulsory-social-security-industry/records",
  location: "Dubai",
  currency: "AED",
  roleFields: ["occupation", "industry", "economic_activity", "activity"],
  valueFields: ["average_monthly_wages", "wages", "value", "earnings"],
  yearFields: ["year"],
  minYear: 2018,
  annualMultiplier: 12,
  sampleSize: 35,
  defaultRole: "Product Manager",
  locationVariants: [
    { location: "Dubai", multiplier: 1 },
    { location: "Abu Dhabi", multiplier: 1.05 },
  ],
});
