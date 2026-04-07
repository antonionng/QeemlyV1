import { describe, expect, it } from "vitest";
import {
  matchLevel,
  matchRole,
  matchRoleWithConfidence,
  normalizeDepartment,
  normalizeEmploymentType,
  normalizePerformanceRating,
  transformEmployee,
} from "@/lib/upload/transformers";

describe("transformEmployee role mapping", () => {
  it("keeps unresolved roles pending instead of defaulting to software engineer", () => {
    const result = transformEmployee({
      firstName: "Ava",
      lastName: "Stone",
      role: "Founder's Associate",
      level: "IC3",
      location: "Dubai",
      totalSalary: "120000",
    });

    expect(result).toMatchObject({
      roleId: null,
      canonicalRoleId: null,
      originalRoleText: "Founder's Associate",
      roleMappingStatus: "needs_review",
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
      totalSalary: "120000",
    });

    expect(result).toMatchObject({
      roleId: "swe",
      levelId: null,
      originalLevelText: "Career Track Purple",
      roleMappingStatus: "needs_review",
    });
  });

  it("captures high-confidence canonical role metadata for matched titles", () => {
    const result = transformEmployee({
      firstName: "Ava",
      lastName: "Stone",
      role: "Software Engineer",
      level: "IC3",
      location: "Dubai",
      totalSalary: "120000",
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

  it("normalizes common employee enum synonyms used in CSV exports", () => {
    expect(normalizeDepartment("People Ops")).toBe("HR");
    expect(normalizeEmploymentType("Local")).toBe("national");
    expect(normalizeEmploymentType("Expatriate")).toBe("expat");
    expect(normalizePerformanceRating("Meets Expectations")).toBe("meets");
    expect(normalizePerformanceRating("4")).toBe("exceeds");
  });

  it("maps the unsupported CSV titles and locations from Untitled 14.csv", () => {
    expect(matchRole("HR Manager")).toBe("people-ops");
    expect(matchRole("Finance Analyst")).toBe("financial-analyst");
    expect(matchRole("Marketing Executive")).toBe("digital-marketing");
    expect(matchRole("Product Owner")).toBe("pm");
    expect(matchRole("Content Manager")).toBe("content-marketing");
    expect(matchRole("Operations Analyst")).toBe("project-manager");
    expect(matchRole("HR Assistant")).toBe("hr-generalist");
    expect(matchRole("Business Analyst")).toBe("product-analyst");
    expect(matchLevel("Executive")).toBe("vp");
  });

  it("does not over-map broad support and marketing titles to COO", () => {
    expect(matchRole("Customer Support")).not.toBe("coo");
    expect(matchRole("Customer Support")).not.toBe("coo-exec");
    expect(matchRole("Marketing")).not.toBe("coo");
    expect(matchRole("Marketing")).not.toBe("coo-exec");
  });

  it("falls back to review for low-confidence broad role titles", () => {
    const confidence = matchRoleWithConfidence("Marketing")?.confidence;
    expect(confidence === "low" || confidence === "medium").toBe(true);
    expect(matchRole("Marketing")).not.toBe("coo");
  });

  it("maps London and Executive department values from the CSV", () => {
    const result = transformEmployee({
      firstName: "John",
      lastName: "Walker",
      department: "Executive",
      role: "CTO",
      level: "Executive",
      location: "London",
      totalSalary: "600000",
    });

    expect(result).toMatchObject({
      department: "Executive",
      roleId: "cto",
      levelId: "vp",
      locationId: "london",
    });
  });

  it("standardizes equity comparable value from units when value is not provided", () => {
    const result = transformEmployee({
      firstName: "Lina",
      lastName: "Ray",
      department: "Engineering",
      role: "Software Engineer",
      level: "IC3",
      location: "Dubai",
      totalSalary: "200000",
      equityUnits: "1000",
    });

    expect(result).toMatchObject({
      equityUnits: 1000,
      equityComparableValue: 100000,
      equity: 100000,
    });
  });
});
