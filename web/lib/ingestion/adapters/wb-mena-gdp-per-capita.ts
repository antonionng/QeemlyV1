import { createWorldBankAdapter } from "./factory";

export const wbMenaGdpPerCapitaAdapter = createWorldBankAdapter({
  slug: "wb_mena_gdp_per_capita",
  indicatorId: "NY.GDP.PCAP.CD",
  role: "Product Manager",
  countries: "ARB",
  annualMultiplier: 1,
  sampleSize: 40,
});
