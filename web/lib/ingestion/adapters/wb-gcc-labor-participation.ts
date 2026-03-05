import { createWorldBankAdapter } from "./factory";

export const wbGccLaborParticipationAdapter = createWorldBankAdapter({
  slug: "wb_gcc_labor_participation",
  indicatorId: "SL.TLF.CACT.ZS",
  role: "Data Analyst",
  countries: "QAT;BHR;OMN;SAU;ARE;KWT",
  annualMultiplier: 1800,
  sampleSize: 46,
});
