import { createWorldBankAdapter } from "./factory";

export const wbGccLaborParticipationAdapter = createWorldBankAdapter({
  slug: "wb_gcc_labor_participation",
  indicatorId: "SL.TLF.CACT.ZS",
  role: "Data Analyst",
  countries: "QAT;BHR;OMN;SAU;ARE;KWT",
  annualMultiplier: 1800,
  sampleSize: 46,
  levelVariants: [
    { level: "Junior (IC1)", multiplier: 0.72 },
    { level: "Mid-Level (IC2)", multiplier: 0.9 },
    { level: "Senior (IC3)", multiplier: 1 },
    { level: "Staff (IC4)", multiplier: 1.16 },
    { level: "Principal (IC5)", multiplier: 1.32 },
  ],
});
