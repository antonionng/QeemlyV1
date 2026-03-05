import { createWorldBankAdapter } from "./factory";

export const wbGccEmployedIndustryAdapter = createWorldBankAdapter({
  slug: "wb_gcc_employed_industry",
  indicatorId: "SL.IND.EMPL.ZS",
  role: "DevOps Engineer",
  countries: "QAT;BHR;OMN;SAU;ARE;KWT",
  annualMultiplier: 1700,
  sampleSize: 44,
});
