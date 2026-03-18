import { createWorldBankAdapter } from "./factory";

export const wbGccEmployedServicesAdapter = createWorldBankAdapter({
  slug: "wb_gcc_employed_services",
  indicatorId: "SL.SRV.EMPL.ZS",
  role: "Software Engineer",
  countries: "QAT;BHR;OMN;SAU;ARE;KWT",
  annualMultiplier: 1700,
  sampleSize: 44,
  levelVariants: [
    { level: "Junior (IC1)", multiplier: 0.65 },
    { level: "Mid-Level (IC2)", multiplier: 0.85 },
    { level: "Senior (IC3)", multiplier: 1 },
    { level: "Staff (IC4)", multiplier: 1.2 },
    { level: "Principal (IC5)", multiplier: 1.38 },
  ],
});
