import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { normalizePilotApplication, validatePilotApplication } from "@/lib/marketing/pilot-application";
import { sendPilotApplicantConfirmation, sendPilotInternalNotification } from "@/lib/email/pilot-application-emails";

async function persistPilotApplication(record: Record<string, unknown>) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("pilot_applications").insert(record);

  if (error) {
    throw new Error(error.message);
  }
}

export async function POST(req: Request) {
  let body = {};

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const errors = validatePilotApplication(body);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }

  const normalized = normalizePilotApplication(body);
  const createdAt = new Date().toISOString();
  const metadata = {
    ...normalized,
    createdAt,
    userAgent: req.headers.get("user-agent") ?? "",
  };

  try {
    await persistPilotApplication({
      name: normalized.name,
      job_role: normalized.jobRole,
      company: normalized.company,
      company_size: normalized.companySize,
      industry: normalized.industry,
      work_email: normalized.workEmail,
      phone_or_whatsapp: normalized.phoneOrWhatsapp || null,
      source_cta: normalized.sourceCta || null,
      source_path: normalized.sourcePath || null,
      user_agent: metadata.userAgent,
      metadata,
    });
  } catch (error) {
    console.error("[pilot-applications] failed to persist application:", error);
    return NextResponse.json(
      { ok: false, error: "We couldn't save your application. Please try again in a minute." },
      { status: 503 },
    );
  }

  try {
    await Promise.all([
      sendPilotInternalNotification({ ...normalized, createdAt }),
      sendPilotApplicantConfirmation({ ...normalized, createdAt }),
    ]);
  } catch (error) {
    console.error("[pilot-applications] failed to send follow-up email:", error);
  }

  return NextResponse.json({ ok: true });
}
