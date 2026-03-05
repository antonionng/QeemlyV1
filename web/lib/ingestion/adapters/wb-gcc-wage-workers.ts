import { createWorldBankAdapter } from "./factory";

export const wbGccWageWorkersAdapter = createWorldBankAdapter({
  slug: "wb_gcc_wage_workers",
  indicatorId: "SL.EMP.WORK.ZS",
  role: "Software Engineer",
  countries: "QAT;BHR;OMN;SAU;ARE;KWT",
  annualMultiplier: 2100,
  sampleSize: 48,
});
