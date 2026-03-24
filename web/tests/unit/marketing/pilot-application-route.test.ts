import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createServiceClientMock,
  sendPilotApplicantConfirmationMock,
  sendPilotInternalNotificationMock,
} = vi.hoisted(() => ({
  createServiceClientMock: vi.fn(),
  sendPilotApplicantConfirmationMock: vi.fn(),
  sendPilotInternalNotificationMock: vi.fn(),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: createServiceClientMock,
}));

vi.mock("@/lib/email/pilot-application-emails", () => ({
  sendPilotApplicantConfirmation: sendPilotApplicantConfirmationMock,
  sendPilotInternalNotification: sendPilotInternalNotificationMock,
}));

function createServiceSupabase() {
  const insertMock = vi.fn().mockResolvedValue({ error: null });

  return {
    insertMock,
    client: {
      from(table: string) {
        expect(table).toBe("pilot_applications");
        return {
          insert: insertMock,
        };
      },
    },
  };
}

describe("pilot application validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects missing required fields", async () => {
    const { validatePilotApplication } = await import("@/lib/marketing/pilot-application");

    expect(
      validatePilotApplication({
        name: "A",
        jobRole: "",
        company: "",
        companySize: "",
        industry: "",
        workEmail: "",
      }),
    ).toEqual({
      name: "Please enter your name.",
      jobRole: "Please enter your job role.",
      company: "Please enter your company name.",
      companySize: "Please select your company size.",
      industry: "Please enter your industry.",
      workEmail: "Please enter a valid work email.",
    });
  });

  it("blocks personal email domains", async () => {
    const { validatePilotApplication } = await import("@/lib/marketing/pilot-application");

    expect(
      validatePilotApplication({
        name: "Ada Lovelace",
        jobRole: "Head of People",
        company: "Qeemly",
        companySize: "51-200",
        industry: "Software",
        workEmail: "ada@gmail.com",
      }),
    ).toEqual({
      workEmail: "Please use your work email.",
    });
  });

  it("rejects unsupported company size values", async () => {
    const { validatePilotApplication } = await import("@/lib/marketing/pilot-application");

    expect(
      validatePilotApplication({
        name: "Ada Lovelace",
        jobRole: "Head of People",
        company: "Qeemly",
        companySize: "a-lot",
        industry: "Software",
        workEmail: "ada@qeemly.com",
      }),
    ).toEqual({
      companySize: "Please select your company size.",
    });
  });

  it("accepts a valid payload with an optional phone or WhatsApp field", async () => {
    const { validatePilotApplication } = await import("@/lib/marketing/pilot-application");

    expect(
      validatePilotApplication({
        name: "Ada Lovelace",
        jobRole: "Head of People",
        company: "Qeemly",
        companySize: "51-200",
        industry: "Software",
        workEmail: "ada@qeemly.com",
        phoneOrWhatsapp: "+971555555555",
        sourceCta: "hero",
        sourcePath: "/home",
      }),
    ).toEqual({});
  });
});

describe("POST /api/pilot-applications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendPilotApplicantConfirmationMock.mockResolvedValue(undefined);
    sendPilotInternalNotificationMock.mockResolvedValue(undefined);
  });

  it("returns a bad request response for invalid JSON", async () => {
    const { POST } = await import("@/app/api/pilot-applications/route");

    const response = await POST(
      new Request("http://localhost/api/pilot-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      ok: false,
      error: "Invalid JSON",
    });
  });

  it("returns field errors for invalid payloads", async () => {
    const { POST } = await import("@/app/api/pilot-applications/route");

    const response = await POST(
      new Request("http://localhost/api/pilot-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Ada",
          jobRole: "Head of People",
          company: "Qeemly",
          companySize: "51-200",
          industry: "Software",
          workEmail: "ada@gmail.com",
          sourceCta: "hero",
          sourcePath: "/home",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      ok: false,
      errors: {
        workEmail: "Please use your work email.",
      },
    });
  });

  it("persists the application and sends both emails for valid payloads", async () => {
    const supabase = createServiceSupabase();
    createServiceClientMock.mockReturnValue(supabase.client);
    const { POST } = await import("@/app/api/pilot-applications/route");

    const response = await POST(
      new Request("http://localhost/api/pilot-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "vitest",
        },
        body: JSON.stringify({
          name: "Ada Lovelace",
          jobRole: "Head of People",
          company: "Qeemly",
          companySize: "51-200",
          industry: "Software",
          workEmail: "ada@qeemly.com",
          phoneOrWhatsapp: "+971555555555",
          sourceCta: "hero",
          sourcePath: "/home",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
    expect(supabase.insertMock).toHaveBeenCalledTimes(1);
    expect(supabase.insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Ada Lovelace",
        job_role: "Head of People",
        company: "Qeemly",
        company_size: "51-200",
        industry: "Software",
        work_email: "ada@qeemly.com",
        phone_or_whatsapp: "+971555555555",
        source_cta: "hero",
        source_path: "/home",
        user_agent: "vitest",
      }),
    );
    expect(sendPilotInternalNotificationMock).toHaveBeenCalledTimes(1);
    expect(sendPilotApplicantConfirmationMock).toHaveBeenCalledTimes(1);
  });

  it("returns a 503 when persistence fails", async () => {
    createServiceClientMock.mockReturnValue({
      from() {
        return {
          insert: vi.fn().mockResolvedValue({
            error: { message: "db unavailable" },
          }),
        };
      },
    });
    const { POST } = await import("@/app/api/pilot-applications/route");

    const response = await POST(
      new Request("http://localhost/api/pilot-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Ada Lovelace",
          jobRole: "Head of People",
          company: "Qeemly",
          companySize: "51-200",
          industry: "Software",
          workEmail: "ada@qeemly.com",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toEqual({
      ok: false,
      error: "We couldn't save your application. Please try again in a minute.",
    });
  });

  it("keeps the application successful even if email delivery fails", async () => {
    const supabase = createServiceSupabase();
    createServiceClientMock.mockReturnValue(supabase.client);
    sendPilotInternalNotificationMock.mockRejectedValueOnce(new Error("mail failed"));
    const { POST } = await import("@/app/api/pilot-applications/route");

    const response = await POST(
      new Request("http://localhost/api/pilot-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Ada Lovelace",
          jobRole: "Head of People",
          company: "Qeemly",
          companySize: "51-200",
          industry: "Software",
          workEmail: "ada@qeemly.com",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
    expect(supabase.insertMock).toHaveBeenCalledTimes(1);
  });
});
