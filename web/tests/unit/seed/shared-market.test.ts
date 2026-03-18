import { describe, expect, it } from "vitest";
import { getDefaultSharedMarketSourceSlugs } from "@/lib/seed/shared-market";

describe("getDefaultSharedMarketSourceSlugs", () => {
  it("keeps only benchmark-shaped sources with adapters in the default shared-market run", () => {
    const result = getDefaultSharedMarketSourceSlugs([
      { slug: "uae_fcsc_workforce_comp" },
      { slug: "uae_fcsc_public_admin_paid" },
      { slug: "uae_fcsc_gov_compensation" },
      { slug: "qatar_wages" },
      { slug: "saudi_gastat_labor" },
      { slug: "jordan_dos_labor" },
      { slug: "worldbank_gcc" },
      { slug: "bls_oes_usa" },
      { slug: "sample_gcc_market" },
      { slug: "gulf_talent_2024" },
    ]);

    expect(result).toEqual(["qatar_wages"]);
  });
});
