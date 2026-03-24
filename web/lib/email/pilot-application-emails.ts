import type { PilotApplicationPayload } from "@/lib/marketing/pilot-application";
import { sendResendEmail } from "@/lib/email/resend";

type PilotApplicationEmailPayload = PilotApplicationPayload & {
  createdAt: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendPilotInternalNotification(payload: PilotApplicationEmailPayload) {
  const to = process.env.PILOT_APPLICATION_NOTIFY_EMAIL;
  if (!to) {
    throw new Error("PILOT_APPLICATION_NOTIFY_EMAIL is required to send internal pilot notifications.");
  }

  const safeName = escapeHtml(payload.name);
  const safeJobRole = escapeHtml(payload.jobRole);
  const safeCompany = escapeHtml(payload.company);
  const safeCompanySize = escapeHtml(payload.companySize);
  const safeIndustry = escapeHtml(payload.industry);
  const safeWorkEmail = escapeHtml(payload.workEmail);
  const safePhone = escapeHtml(payload.phoneOrWhatsapp || "Not provided");
  const safeSourceCta = escapeHtml(payload.sourceCta || "Unknown");
  const safeSourcePath = escapeHtml(payload.sourcePath || "Unknown");
  const safeCreatedAt = escapeHtml(payload.createdAt);

  await sendResendEmail({
    to,
    subject: `New pilot application from ${safeName}`,
    replyTo: payload.workEmail,
    html: `
      <h1>New pilot application</h1>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Job role:</strong> ${safeJobRole}</p>
      <p><strong>Company:</strong> ${safeCompany}</p>
      <p><strong>Company size:</strong> ${safeCompanySize}</p>
      <p><strong>Industry:</strong> ${safeIndustry}</p>
      <p><strong>Work email:</strong> ${safeWorkEmail}</p>
      <p><strong>Phone / WhatsApp:</strong> ${safePhone}</p>
      <p><strong>Source CTA:</strong> ${safeSourceCta}</p>
      <p><strong>Source path:</strong> ${safeSourcePath}</p>
      <p><strong>Submitted at:</strong> ${safeCreatedAt}</p>
    `,
  });
}

export async function sendPilotApplicantConfirmation(payload: PilotApplicationEmailPayload) {
  const safeName = escapeHtml(payload.name);

  await sendResendEmail({
    to: payload.workEmail,
    subject: "We received your Qeemly pilot application",
    replyTo: "hello@qeemly.com",
    html: `
      <h1>Thanks for applying to the Qeemly pilot</h1>
      <p>Hi ${safeName},</p>
      <p>We have received your application and will review it personally.</p>
      <p>If there is a fit, we will follow up with the right next step, whether that is a demo, pilot access, or a tailored rollout conversation.</p>
      <p>Best,<br />Qeemly</p>
    `,
  });
}
