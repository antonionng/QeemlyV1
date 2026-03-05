import { createWorldBankAdapter } from "./factory";

export const wbGccGdpPerCapitaAdapter = createWorldBankAdapter({
  slug: "wb_gcc_gdp_per_capita",
  indicatorId: "NY.GDP.PCAP.CD",
  role: "Product Manager",
  countries: "QAT;BHR;OMN;SAU;ARE;KWT",
  annualMultiplier: 1,
  sampleSize: 55,
});
