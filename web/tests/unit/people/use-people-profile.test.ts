import { describe, expect, it } from "vitest";
import { buildEmployeeProfilePayload } from "@/lib/people/use-people";

describe("buildEmployeeProfilePayload", () => {
  it("builds employee, enrichment, and visa sections for the rich profile API", () => {
    const payload = buildEmployeeProfilePayload({
      employeeUpdates: {
        firstName: "Ada",
        employmentType: "expat",
        baseSalary: 150_000,
      },
      profileEnrichment: {
        preferredName: "Ada L.",
        managerName: "Grace Hopper",
        avatarUrl: "https://example.com/ada.png",
      },
      visaRecord: {
        visaStatus: "active",
        expiryDate: "2026-12-01",
      },
    });

    expect(payload).toEqual({
      employeeUpdates: {
        first_name: "Ada",
        employment_type: "expat",
        base_salary: 150000,
      },
      profileEnrichment: {
        preferred_name: "Ada L.",
        manager_name: "Grace Hopper",
        avatar_url: "https://example.com/ada.png",
      },
      visaRecords: [
        {
          visa_status: "active",
          expiry_date: "2026-12-01",
        },
      ],
    });
  });

  it("preserves additional visa rows when the primary visa entry is updated", () => {
    const payload = buildEmployeeProfilePayload({
      visaRecords: [
        {
          id: "visa-1",
          visaStatus: "expiring",
          expiryDate: "2026-09-01",
        },
        {
          id: "visa-2",
          visaStatus: "pending",
          expiryDate: "2027-01-15",
        },
      ],
    });

    expect(payload).toEqual({
      visaRecords: [
        {
          id: "visa-1",
          visa_status: "expiring",
          expiry_date: "2026-09-01",
        },
        {
          id: "visa-2",
          visa_status: "pending",
          expiry_date: "2027-01-15",
        },
      ],
    });
  });
});
