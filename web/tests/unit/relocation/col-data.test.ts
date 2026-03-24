import { describe, expect, it } from "vitest";

import { CITIES, searchCities } from "@/lib/relocation/col-data";

describe("relocation city data", () => {
  it("includes major global tech hubs with flags in the fallback dataset", () => {
    const requiredCities = [
      {
        id: "san-francisco",
        name: "San Francisco",
        country: "United States",
        region: "americas",
        flag: "🇺🇸",
      },
      {
        id: "toronto",
        name: "Toronto",
        country: "Canada",
        region: "americas",
        flag: "🇨🇦",
      },
      {
        id: "amsterdam",
        name: "Amsterdam",
        country: "Netherlands",
        region: "europe",
        flag: "🇳🇱",
      },
      {
        id: "bengaluru",
        name: "Bengaluru",
        country: "India",
        region: "asia",
        flag: "🇮🇳",
      },
      {
        id: "sydney",
        name: "Sydney",
        country: "Australia",
        region: "asia",
        flag: "🇦🇺",
      },
    ] as const;

    for (const expectedCity of requiredCities) {
      expect(CITIES).toContainEqual(expect.objectContaining(expectedCity));
    }
  });

  it("finds newly added global cities through search", () => {
    expect(searchCities("san francisco")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "san-francisco",
          flag: "🇺🇸",
        }),
      ]),
    );

    expect(searchCities("toronto")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "toronto",
          flag: "🇨🇦",
        }),
      ]),
    );

    expect(searchCities("bengaluru")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "bengaluru",
          flag: "🇮🇳",
        }),
      ]),
    );
  });
});
