import { describe, expect, it } from "vitest";
import { matchLevel, matchRole, transformEmployee } from "@/lib/upload/transformers";

describe("transformEmployee role mapping", () => {
  it("keeps unresolved roles pending instead of defaulting to software engineer", () => {
    const result = transformEmployee({
      firstName: "Ava",
      lastName: "Stone",
      role: "Founder's Associate",
      level: "IC3",
      location: "Dubai",
      baseSalary: "120000",
    });

    expect(result).toMatchObject({
      roleId: null,
      canonicalRoleId: null,
      originalRoleText: "Founder's Associate",
      roleMappingStatus: "pending",
      roleMappingSource: "upload",
    });
  });

  it("keeps unresolved levels pending instead of defaulting to ic3", () => {
    const result = transformEmployee({
      firstName: "Ava",
      lastName: "Stone",
      role: "Software Engineer",
      level: "Career Track Purple",
      location: "Dubai",
      baseSalary: "120000",
    });

    expect(result).toMatchObject({
      roleId: "swe",
      levelId: null,
      originalLevelText: "Career Track Purple",
      roleMappingStatus: "pending",
    });
  });

  it("captures high-confidence canonical role metadata for matched titles", () => {
    const result = transformEmployee({
      firstName: "Ava",
      lastName: "Stone",
      role: "Software Engineer",
      level: "IC3",
      location: "Dubai",
      baseSalary: "120000",
    });

    expect(result).toMatchObject({
      roleId: "swe",
      canonicalRoleId: "swe",
      roleMappingConfidence: "high",
      roleMappingStatus: "mapped",
      roleMappingSource: "upload",
      originalRoleText: "Software Engineer",
      originalLevelText: "IC3",
    });
  });

  it("maps common engineering subrole synonyms to canonical roles", () => {
    expect(matchRole("Frontend Developer")).toBe("swe-fe");
    expect(matchRole("Backend Developer")).toBe("swe-be");
    expect(matchRole("Mobile App Engineer")).toBe("swe-mobile");
    expect(matchRole("Machine Learning Engineer")).toBe("swe-ml");
    expect(matchRole("Data Platform Engineer")).toBe("swe-data");
    expect(matchRole("Technical Program Manager")).toBe("tpm");
  });

  it("maps common seniority words to canonical levels", () => {
    expect(matchLevel("Junior")).toBe("ic1");
    expect(matchLevel("Mid")).toBe("ic2");
    expect(matchLevel("Lead")).toBe("ic4");
    expect(matchLevel("Principal")).toBe("ic5");
    expect(matchLevel("Senior Manager")).toBe("m2");
    expect(matchLevel("Director")).toBe("d1");
    expect(matchLevel("Vice President")).toBe("vp");
  });
});
