import { describe, expect, it } from "vitest";
import {
  createClientError,
  parseClientError,
  toClientErrorBody,
  toClientSafeError,
} from "@/lib/errors/client-safe";
import { jsonServerError, jsonValidationError, serverActionError } from "@/lib/errors/http";

describe("toClientSafeError", () => {
  it("maps unique email violations to a field-level message", () => {
    const problem = toClientSafeError(
      {
        code: "23505",
        message: 'duplicate key value violates unique constraint "profiles_email_key"',
        details: "Key (email)=(ada@example.com) already exists.",
      },
      {
        defaultMessage: "We could not save this team member.",
      },
    );

    const serialized = JSON.stringify(problem).toLowerCase();

    expect(problem.code).toBe("duplicate_value");
    expect(problem.message).toBe("Please correct the highlighted fields and try again.");
    expect(problem.fields).toEqual({
      email: "Email is already in use. Use a different email address.",
    });
    expect(problem.action).toBe("Update the highlighted fields and try again.");
    expect(serialized).not.toContain("violates");
    expect(serialized).not.toContain("profiles_email_key");
  });

  it("maps invalid numeric input to an actionable field hint", () => {
    const problem = toClientSafeError(
      {
        code: "22P02",
        message: 'invalid input syntax for type bigint: "abc"',
      },
      {
        defaultMessage: "We could not save compensation.",
        field: {
          key: "salary",
          label: "Salary",
          example: "50000",
        },
      },
    );

    const serialized = JSON.stringify(problem).toLowerCase();

    expect(problem.code).toBe("invalid_number");
    expect(problem.fields).toEqual({
      salary: "Salary must be a number. Example: 50000",
    });
    expect(problem.message).toBe("Please correct the highlighted fields and try again.");
    expect(serialized).not.toContain("invalid input syntax");
    expect(serialized).not.toContain("bigint");
    expect(serialized).not.toContain("\"abc\"");
  });

  it("hides raw relation names and database wording", () => {
    const problem = toClientSafeError(
      {
        code: "42P01",
        message: 'relation "workspace_compliance_settings" does not exist',
      },
      {
        defaultMessage: "We could not load compliance settings right now.",
      },
    );

    const serialized = JSON.stringify(problem).toLowerCase();

    expect(problem.code).toBe("service_unavailable");
    expect(problem.message).toBe("This feature is temporarily unavailable. Please try again in a moment.");
    expect(serialized).not.toContain("relation");
    expect(serialized).not.toContain("workspace_compliance_settings");
    expect(problem.action).toBe("Refresh the page or try again in a few minutes.");
  });

  it("maps postgrest schema cache failures to the same safe unavailable message", () => {
    const problem = toClientSafeError(
      {
        code: "PGRST205",
        message: 'Could not find the table in the schema cache: "workspace_compliance_settings"',
      },
      {
        defaultMessage: "We could not load compliance settings right now.",
      },
    );

    const serialized = JSON.stringify(problem).toLowerCase();

    expect(problem.code).toBe("service_unavailable");
    expect(problem.message).toBe("This feature is temporarily unavailable. Please try again in a moment.");
    expect(serialized).not.toContain("schema cache");
    expect(serialized).not.toContain("workspace_compliance_settings");
  });

  it("maps foreign key violations to a safe field-level message", () => {
    const problem = toClientSafeError(
      {
        code: "23503",
        message: 'insert or update on table "employees" violates foreign key constraint "employees_role_id_fkey"',
        details: "Key (role_id)=(missing-role) is not present in table \"roles\".",
      },
      {
        defaultMessage: "We could not save this employee.",
        field: {
          key: "roleId",
          label: "Role",
        },
      },
    );

    const serialized = JSON.stringify(problem).toLowerCase();

    expect(problem.code).toBe("invalid_reference");
    expect(problem.message).toBe("Please correct the highlighted fields and try again.");
    expect(problem.fields).toEqual({
      roleId: "Choose a valid role and try again.",
    });
    expect(serialized).not.toContain("violates");
    expect(serialized).not.toContain("employees_role_id_fkey");
    expect(serialized).not.toContain("missing-role");
  });

  it("normalizes unknown thrown errors to the caller-safe default", () => {
    const problem = toClientSafeError(new Error("socket hang up"), {
        defaultMessage: "We could not save settings.",
      });

    const serialized = JSON.stringify(problem).toLowerCase();

    expect(problem).toEqual({
      code: "unknown_error",
      message: "We could not save settings.",
      action: "Try again. If the problem continues, contact support.",
      fields: undefined,
      rows: undefined,
    });
    expect(serialized).not.toContain("socket hang up");
  });
});

describe("createClientError", () => {
  it("preserves row-level issues for bulk flows", () => {
    const problem = createClientError({
      code: "import_failed",
      message: "Some rows could not be imported.",
      action: "Fix the highlighted rows and upload again.",
      rows: [
        {
          row: 3,
          field: "salary",
          message: "Salary must be a number. Example: 50000",
        },
      ],
    });

    expect(problem.rows).toEqual([
      {
        row: 3,
        field: "salary",
        message: "Salary must be a number. Example: 50000",
      },
    ]);
    expect(toClientErrorBody(problem)).toEqual({
      error: "Some rows could not be imported.",
      message: "Some rows could not be imported.",
      code: "import_failed",
      action: "Fix the highlighted rows and upload again.",
      rows: [
        {
          row: 3,
          field: "salary",
          message: "Salary must be a number. Example: 50000",
        },
      ],
    });
  });
});

describe("parseClientError", () => {
  it("parses the new structured contract", () => {
    expect(
      parseClientError({
        error: "Unable to save settings.",
        code: "save_failed",
        action: "Try again.",
        fields: {
          companyName: "Company name is required.",
        },
      }),
    ).toEqual({
      message: "Unable to save settings.",
      code: "save_failed",
      action: "Try again.",
      fields: {
        companyName: "Company name is required.",
      },
      rows: undefined,
    });
  });

  it("supports legacy string errors during the migration", () => {
    expect(parseClientError({ error: "Legacy error" })).toEqual({
      message: "Legacy error",
      code: "unknown_error",
      action: null,
      fields: undefined,
      rows: undefined,
    });
  });
});

describe("http helpers", () => {
  it("serializes validation problems with the shared contract", async () => {
    const response = jsonValidationError({
      message: "Please correct the highlighted fields and try again.",
      fields: {
        salary: "Salary must be a number. Example: 50000",
      },
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Please correct the highlighted fields and try again.",
      message: "Please correct the highlighted fields and try again.",
      code: "validation_error",
      action: "Update the highlighted fields and try again.",
      fields: {
        salary: "Salary must be a number. Example: 50000",
      },
    });
  });

  it("serializes safe server action errors without leaking provider text", () => {
    const payload = serverActionError(
      new Error("socket hang up"),
      {
        defaultMessage: "We could not save settings.",
      },
    );

    expect(payload).toEqual({
      error: "We could not save settings.",
      message: "We could not save settings.",
      code: "unknown_error",
      action: "Try again. If the problem continues, contact support.",
    });
  });

  it("wraps server errors in a safe json response", async () => {
    const response = jsonServerError(
      {
        code: "23503",
        message: 'insert or update on table "employees" violates foreign key constraint "employees_role_id_fkey"',
      },
      {
        defaultMessage: "We could not save this employee.",
        field: {
          key: "roleId",
          label: "Role",
        },
      },
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Please correct the highlighted fields and try again.",
      message: "Please correct the highlighted fields and try again.",
      code: "invalid_reference",
      action: "Update the highlighted fields and try again.",
      fields: {
        roleId: "Choose a valid role and try again.",
      },
    });
  });
});
