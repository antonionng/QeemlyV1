import { Resend } from "resend";

type ResendEmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

function getResendApiKey() {
  return process.env.RESEND_API_KEY;
}

export function getResendFromEmail() {
  return process.env.RESEND_FROM_EMAIL || "Qeemly <onboarding@resend.dev>";
}

export async function sendResendEmail(payload: ResendEmailPayload) {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required to send email.");
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: getResendFromEmail(),
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    replyTo: payload.replyTo,
  });

  if (error) {
    throw new Error(`Resend request failed: ${error.message}`);
  }
}
