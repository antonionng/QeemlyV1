import { createWorldBankAdapter } from "./factory";

export const wbGccUnemploymentAdapter = createWorldBankAdapter({
  slug: "wb_gcc_unemployment",
  indicatorId: "SL.UEM.TOTL.ZS",
  role: "Data Analyst",
  countries: "QAT;BHR;OMN;SAU;ARE;KWT",
  annualMultiplier: 2200,
  sampleSize: 50,
  levelVariants: [
    { level: "Junior (IC1)", multiplier: 0.7 },
    { level: "Mid-Level (IC2)", multiplier: 0.88 },
    { level: "Senior (IC3)", multiplier: 1 },
    { level: "Staff (IC4)", multiplier: 1.18 },
    { level: "Principal (IC5)", multiplier: 1.35 },
  ],
});
