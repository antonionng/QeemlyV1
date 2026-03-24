import { beforeEach, describe, expect, it, vi } from "vitest";

const { emailSendMock, ResendMock } = vi.hoisted(() => ({
  emailSendMock: vi.fn(),
  ResendMock: vi.fn(function MockResend() {
    return {
      emails: {
        send: emailSendMock,
      },
    };
  }),
}));

vi.mock("resend", () => ({
  Resend: ResendMock,
}));

describe("sendResendEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.RESEND_API_KEY = "resend_test_key";
    process.env.RESEND_FROM_EMAIL = "Qeemly <pilot@qeemly.com>";
    emailSendMock.mockResolvedValue({ data: { id: "email-1" }, error: null });
  });

  it("uses the Resend client with branded sender details", async () => {
    const { sendResendEmail } = await import("@/lib/email/resend");

    await sendResendEmail({
      to: "ada@qeemly.com",
      subject: "Pilot application received",
      html: "<p>Hello</p>",
      replyTo: "hello@qeemly.com",
    });

    expect(ResendMock).toHaveBeenCalledWith("resend_test_key");
    expect(emailSendMock).toHaveBeenCalledWith({
      from: "Qeemly <pilot@qeemly.com>",
      to: "ada@qeemly.com",
      subject: "Pilot application received",
      html: "<p>Hello</p>",
      replyTo: "hello@qeemly.com",
    });
  });

  it("falls back to the Resend test sender when no branded sender is configured", async () => {
    delete process.env.RESEND_FROM_EMAIL;
    const { sendResendEmail } = await import("@/lib/email/resend");

    await sendResendEmail({
      to: "ada@qeemly.com",
      subject: "Pilot application received",
      html: "<p>Hello</p>",
    });

    expect(emailSendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Qeemly <onboarding@resend.dev>",
      }),
    );
  });
});
