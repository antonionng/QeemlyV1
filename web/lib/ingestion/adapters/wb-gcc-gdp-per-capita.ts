import { createWorldBankAdapter } from "./factory";

export const wbGccGdpPerCapitaAdapter = createWorldBankAdapter({
  slug: "wb_gcc_gdp_per_capita",
  indicatorId: "NY.GDP.PCAP.CD",
  role: "Product Manager",
  countries: "QAT;BHR;OMN;SAU;ARE;KWT",
  annualMultiplier: 1,
  sampleSize: 55,
  levelVariants: [
    { level: "Mid-Level (IC2)", multiplier: 0.8 },
    { level: "Senior (IC3)", multiplier: 1 },
    { level: "Staff (IC4)", multiplier: 1.18 },
    { level: "Manager (M1)", multiplier: 1.3 },
    { level: "Senior Manager (M2)", multiplier: 1.42 },
  ],
});
