import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

type ContactPayload = {
  name: string;
  email: string;
  company: string;
  role: string;
  teamSize?: string;
  interests?: string[];
  message: string;
  preferredContact?: "email" | "whatsapp";
};

function isEmail(email: string) {
  // Reasonable email heuristic for marketing forms (not RFC-complete).
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validate(payload: Partial<ContactPayload>) {
  const errors: Record<string, string> = {};

  const name = (payload.name ?? "").trim();
  const email = (payload.email ?? "").trim();
  const company = (payload.company ?? "").trim();
  const role = (payload.role ?? "").trim();
  const message = (payload.message ?? "").trim();

  if (name.length < 2) errors.name = "Please enter your name.";
  if (!isEmail(email)) errors.email = "Please enter a valid work email.";
  if (company.length < 2) errors.company = "Please enter your company name.";
  if (role.length < 2) errors.role = "Please enter your role.";
  if (message.length < 10) errors.message = "Please add a bit more detail (at least 10 characters).";

  return errors;
}

async function persistLead(lead: Record<string, unknown>) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("contact_leads").insert({
    name: lead.name,
    email: lead.email,
    company: lead.company,
    role: lead.role,
    team_size: lead.teamSize,
    interests: lead.interests,
    message: lead.message,
    preferred_contact: lead.preferredContact,
    user_agent: lead.userAgent,
    metadata: lead,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function POST(req: Request) {
  let body: Partial<ContactPayload> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const errors = validate(body);
  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }

  const lead = {
    id: `lead_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    name: body.name?.trim(),
    email: body.email?.trim(),
    company: body.company?.trim(),
    role: body.role?.trim(),
    teamSize: body.teamSize ?? "",
    interests: Array.isArray(body.interests) ? body.interests : [],
    preferredContact: body.preferredContact ?? "email",
    message: body.message?.trim(),
    userAgent: req.headers.get("user-agent") ?? "",
  };

  // Always log to server output for visibility.
  console.log("[contact] lead submitted:", lead);

  try {
    await persistLead(lead);
  } catch (e) {
    console.error("[contact] failed to persist lead:", e);
    return NextResponse.json(
      {
        ok: false,
        error: "We couldn't save your message. Please try again in a minute.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true });
}


