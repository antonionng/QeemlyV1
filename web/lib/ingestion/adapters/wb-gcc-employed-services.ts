import { createWorldBankAdapter } from "./factory";

export const wbGccEmployedServicesAdapter = createWorldBankAdapter({
  slug: "wb_gcc_employed_services",
  indicatorId: "SL.SRV.EMPL.ZS",
  role: "Software Engineer",
  countries: "QAT;BHR;OMN;SAU;ARE;KWT",
  annualMultiplier: 1700,
  sampleSize: 44,
});
