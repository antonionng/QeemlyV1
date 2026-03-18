import { createWorldBankAdapter } from "./factory";

export const wbGccEmployedIndustryAdapter = createWorldBankAdapter({
  slug: "wb_gcc_employed_industry",
  indicatorId: "SL.IND.EMPL.ZS",
  role: "DevOps Engineer",
  countries: "QAT;BHR;OMN;SAU;ARE;KWT",
  annualMultiplier: 1700,
  sampleSize: 44,
  levelVariants: [
    { level: "Junior (IC1)", multiplier: 0.68 },
    { level: "Mid-Level (IC2)", multiplier: 0.86 },
    { level: "Senior (IC3)", multiplier: 1 },
    { level: "Staff (IC4)", multiplier: 1.18 },
    { level: "Principal (IC5)", multiplier: 1.34 },
  ],
});
