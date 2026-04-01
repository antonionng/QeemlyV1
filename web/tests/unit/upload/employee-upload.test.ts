import { afterEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: createClientMock,
}));

describe("uploadEmployees", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("upserts employee rows by email and reports created versus updated counts", async () => {
    const profileQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { workspace_id: "ws-1" } }),
    };

    const existingEmployeesQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [{ id: "emp-existing", email: "ada@example.com", workspace_id: "ws-1" }],
        error: null,
      }),
    };

    const updateWorkspaceEq = vi.fn().mockResolvedValue({ error: null });
    const employeesQuery = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: updateWorkspaceEq,
        }),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: "emp-new", email: "grace@example.com" }],
          error: null,
        }),
      }),
    };
    let employeeTableCall = 0;

    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") return profileQuery;
        if (table === "employees") {
          employeeTableCall += 1;
          return employeeTableCall === 1 ? existingEmployeesQuery : employeesQuery;
        }
        if (table === "employee_profile_enrichment") {
          return { upsert: vi.fn().mockResolvedValue({ error: null }) };
        }
        if (table === "employee_visa_records") {
          return { insert: vi.fn().mockResolvedValue({ error: null }) };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { uploadEmployees } = await import("@/lib/upload/api");

    const result = await uploadEmployees([
      {
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        department: "Engineering",
        roleId: "swe",
        levelId: "ic3",
        locationId: "dubai",
        baseSalary: 120_000,
        bonus: null,
        equity: null,
        currency: "AED",
        status: "active",
        employmentType: "national",
        hireDate: null,
        performanceRating: null,
        avatarUrl: null,
        visaType: null,
        visaStatus: null,
        visaIssueDate: null,
        visaExpiryDate: null,
        visaSponsor: null,
        visaPermitId: null,
      },
      {
        firstName: "Grace",
        lastName: "Hopper",
        email: "grace@example.com",
        department: "Engineering",
        roleId: "swe",
        levelId: "ic3",
        locationId: "dubai",
        baseSalary: 135_000,
        bonus: null,
        equity: null,
        currency: "AED",
        status: "active",
        employmentType: "national",
        hireDate: null,
        performanceRating: null,
        avatarUrl: null,
        visaType: null,
        visaStatus: null,
        visaIssueDate: null,
        visaExpiryDate: null,
        visaSponsor: null,
        visaPermitId: null,
      },
    ]);

    expect(result.success).toBe(true);
    expect(result.createdCount).toBe(1);
    expect(result.updatedCount).toBe(1);
    expect(result.processedEmployees).toEqual([
      expect.objectContaining({
        email: "ada@example.com",
        action: "updated",
      }),
      expect.objectContaining({
        email: "grace@example.com",
        action: "created",
      }),
    ]);
    expect(employeesQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: "Ada",
        last_name: "Lovelace",
        base_salary: 120000,
      }),
    );
    expect(updateWorkspaceEq).toHaveBeenCalledWith("workspace_id", "ws-1");
    expect(employeesQuery.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          email: "grace@example.com",
        }),
      ]),
    );
  });

  it("clears the current roster before reimporting in replace mode", async () => {
    const profileQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { workspace_id: "ws-1" } }),
    };

    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const employeesQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: deleteEq,
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: "emp-new", email: "new@example.com" }],
          error: null,
        }),
      }),
    };

    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") return profileQuery;
        if (table === "employees") {
          return employeesQuery;
        }
        if (table === "employee_profile_enrichment") {
          return { upsert: vi.fn().mockResolvedValue({ error: null }) };
        }
        if (table === "employee_visa_records") {
          return { insert: vi.fn().mockResolvedValue({ error: null }) };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { uploadEmployees } = await import("@/lib/upload/api");

    await uploadEmployees(
      [
        {
          firstName: "New",
          lastName: "Person",
          email: "new@example.com",
          department: "Engineering",
          roleId: "swe",
          levelId: "ic3",
          locationId: "dubai",
          baseSalary: 120_000,
          bonus: null,
          equity: null,
          currency: "AED",
          status: "active",
          employmentType: "national",
          hireDate: null,
          performanceRating: null,
          avatarUrl: null,
          visaType: null,
          visaStatus: null,
          visaIssueDate: null,
          visaExpiryDate: null,
          visaSponsor: null,
          visaPermitId: null,
        },
      ],
      undefined,
      { mode: "replace" },
    );

    expect(deleteEq).toHaveBeenCalledWith("workspace_id", "ws-1");
  });

  it("rejects employee emails that already belong to another workspace", async () => {
    const profileQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { workspace_id: "ws-1" } }),
    };

    const existingEmployeesQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [{ id: "emp-external", email: "ada@example.com", workspace_id: "ws-2" }],
        error: null,
      }),
    };

    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") return profileQuery;
        if (table === "employees") {
          if (existingEmployeesQuery.select.mock.calls.length === 0) {
            return existingEmployeesQuery;
          }
          return {
            update: vi.fn(),
            insert: vi.fn().mockReturnValue({ select: vi.fn() }),
          };
        }
        if (table === "employee_profile_enrichment") {
          return { upsert: vi.fn().mockResolvedValue({ error: null }) };
        }
        if (table === "employee_visa_records") {
          return { delete: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), in: vi.fn(), insert: vi.fn() };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { uploadEmployees } = await import("@/lib/upload/api");

    const result = await uploadEmployees([
      {
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        department: "Engineering",
        roleId: "swe",
        levelId: "ic3",
        locationId: "dubai",
        baseSalary: 120_000,
        bonus: null,
        equity: null,
        currency: "AED",
        status: "active",
        employmentType: "national",
        hireDate: null,
        performanceRating: null,
        avatarUrl: null,
        visaType: null,
        visaStatus: null,
        visaIssueDate: null,
        visaExpiryDate: null,
        visaSponsor: null,
        visaPermitId: null,
      },
    ]);

    expect(result.success).toBe(false);
    expect(result.failedCount).toBe(1);
    expect(result.errors[0]).toContain("another workspace");
  });

  it("rejects unresolved employee roles before inserting null role ids", async () => {
    const profileQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { workspace_id: "ws-1" } }),
    };

    const existingEmployeesQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    const roleMappingReviewsInsert = vi.fn().mockResolvedValue({ error: null });
    const employeesInsert = vi.fn();

    let employeeTableCall = 0;

    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") return profileQuery;
        if (table === "employees") {
          employeeTableCall += 1;
          return employeeTableCall === 1
            ? existingEmployeesQuery
            : {
                insert: employeesInsert,
              };
        }
        if (table === "role_mapping_reviews") {
          return { insert: roleMappingReviewsInsert };
        }
        if (table === "employee_profile_enrichment") {
          return { upsert: vi.fn().mockResolvedValue({ error: null }) };
        }
        if (table === "employee_visa_records") {
          return { insert: vi.fn().mockResolvedValue({ error: null }) };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { uploadEmployees } = await import("@/lib/upload/api");

    const result = await uploadEmployees([
      {
        firstName: "Ava",
        lastName: "Stone",
        email: "ava@example.com",
        department: "Operations",
        roleId: null,
        canonicalRoleId: null,
        roleMappingConfidence: "low",
        roleMappingSource: "upload",
        roleMappingStatus: "pending",
        originalRoleText: "Founder's Associate",
        levelId: "ic3",
        originalLevelText: "IC3",
        locationId: "dubai",
        baseSalary: 120_000,
        bonus: null,
        equity: null,
        currency: "AED",
        status: "active",
        employmentType: "national",
        hireDate: null,
        performanceRating: null,
        avatarUrl: null,
        visaType: null,
        visaStatus: null,
        visaIssueDate: null,
        visaExpiryDate: null,
        visaSponsor: null,
        visaPermitId: null,
      },
    ]);

    expect(result.success).toBe(false);
    expect(result.failedCount).toBe(1);
    expect(result.errors).toEqual([
      "Ava Stone (ava@example.com) could not be imported because the role title could not be mapped to a supported Qeemly role.",
    ]);
    expect(employeesInsert).not.toHaveBeenCalled();
    expect(roleMappingReviewsInsert).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("applies approved workspace aliases before creating a new review", async () => {
    const profileQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { workspace_id: "ws-1" } }),
    };

    const existingEmployeesQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    const employeesInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ id: "emp-new", email: "ava@example.com" }],
        error: null,
      }),
    });

    let employeeTableCall = 0;

    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") return profileQuery;
        if (table === "employees") {
          employeeTableCall += 1;
          return employeeTableCall === 1
            ? existingEmployeesQuery
            : {
                insert: employeesInsert,
              };
        }
        if (table === "canonical_role_aliases") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  canonical_role_id: "pm",
                  alias_normalized: "founder s associate",
                },
              ],
              error: null,
            }),
          };
        }
        if (table === "role_mapping_reviews") {
          return { insert: vi.fn().mockResolvedValue({ error: null }) };
        }
        if (table === "employee_profile_enrichment") {
          return { upsert: vi.fn().mockResolvedValue({ error: null }) };
        }
        if (table === "employee_visa_records") {
          return { insert: vi.fn().mockResolvedValue({ error: null }) };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { uploadEmployees } = await import("@/lib/upload/api");

    const result = await uploadEmployees([
      {
        firstName: "Ava",
        lastName: "Stone",
        email: "ava@example.com",
        department: "Operations",
        roleId: null,
        canonicalRoleId: null,
        roleMappingConfidence: "low",
        roleMappingSource: "upload",
        roleMappingStatus: "pending",
        originalRoleText: "Founder's Associate",
        levelId: "ic3",
        originalLevelText: "IC3",
        locationId: "dubai",
        baseSalary: 120_000,
        bonus: null,
        equity: null,
        currency: "AED",
        status: "active",
        employmentType: "national",
        hireDate: null,
        performanceRating: null,
        avatarUrl: null,
        visaType: null,
        visaStatus: null,
        visaIssueDate: null,
        visaExpiryDate: null,
        visaSponsor: null,
        visaPermitId: null,
      },
    ]);

    expect(result.success).toBe(true);
    expect(employeesInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        role_id: "pm",
        canonical_role_id: "pm",
        role_mapping_status: "mapped",
      }),
    ]);
  });
});
