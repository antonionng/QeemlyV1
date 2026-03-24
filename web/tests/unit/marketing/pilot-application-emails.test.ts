import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendResendEmailMock } = vi.hoisted(() => ({
  sendResendEmailMock: vi.fn(),
}));

vi.mock("@/lib/email/resend", () => ({
  sendResendEmail: sendResendEmailMock,
}));

describe("pilot application emails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PILOT_APPLICATION_NOTIFY_EMAIL = "pilots@qeemly.com";
  });

  it("sends an internal notification to the configured Qeemly inbox", async () => {
    const { sendPilotInternalNotification } = await import("@/lib/email/pilot-application-emails");

    await sendPilotInternalNotification({
      name: "Ada Lovelace",
      jobRole: "Head of People",
      company: "Qeemly",
      companySize: "51-200",
      industry: "Software",
      workEmail: "ada@qeemly.com",
      phoneOrWhatsapp: "+971555555555",
      sourceCta: "hero",
      sourcePath: "/home",
      createdAt: "2026-03-24T10:00:00.000Z",
    });

    expect(sendResendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "pilots@qeemly.com",
        subject: "New pilot application from Ada Lovelace",
        replyTo: "ada@qeemly.com",
      }),
    );
  });

  it("sends a branded applicant confirmation email", async () => {
    const { sendPilotApplicantConfirmation } = await import("@/lib/email/pilot-application-emails");

    await sendPilotApplicantConfirmation({
      name: "Ada Lovelace",
      jobRole: "Head of People",
      company: "Qeemly",
      companySize: "51-200",
      industry: "Software",
      workEmail: "ada@qeemly.com",
      phoneOrWhatsapp: "",
      sourceCta: "hero",
      sourcePath: "/home",
      createdAt: "2026-03-24T10:00:00.000Z",
    });

    expect(sendResendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "ada@qeemly.com",
        subject: "We received your Qeemly pilot application",
        replyTo: "hello@qeemly.com",
      }),
    );
  });

  it("escapes applicant content before building email HTML", async () => {
    const { sendPilotInternalNotification } = await import("@/lib/email/pilot-application-emails");

    await sendPilotInternalNotification({
      name: '<img src=x onerror="alert(1)">',
      jobRole: "Head of People",
      company: "Qeemly & Co",
      companySize: "51-200",
      industry: "Software",
      workEmail: "ada@qeemly.com",
      phoneOrWhatsapp: "",
      sourceCta: "hero",
      sourcePath: "/home",
      createdAt: "2026-03-24T10:00:00.000Z",
    });

    expect(sendResendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"),
      }),
    );
    expect(sendResendEmailMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('<img src=x onerror="alert(1)">'),
      }),
    );
  });
});
