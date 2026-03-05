import { createWorldBankAdapter } from "./factory";

export const wbGccUnemploymentAdapter = createWorldBankAdapter({
  slug: "wb_gcc_unemployment",
  indicatorId: "SL.UEM.TOTL.ZS",
  role: "Data Analyst",
  countries: "QAT;BHR;OMN;SAU;ARE;KWT",
  annualMultiplier: 2200,
  sampleSize: 50,
});
