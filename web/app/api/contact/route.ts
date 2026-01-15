import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

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

async function appendLead(lead: Record<string, unknown>) {
  // Best-effort persistence for dev/self-hosted. Serverless platforms may not persist filesystem.
  const dataDir = path.join(process.cwd(), "data");
  const filePath = path.join(dataDir, "leads.json");
  await fs.mkdir(dataDir, { recursive: true });

  let existing: unknown[] = [];
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) existing = parsed;
  } catch {
    // ignore
  }

  existing.unshift(lead);
  await fs.writeFile(filePath, JSON.stringify(existing, null, 2), "utf8");
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
    await appendLead(lead);
  } catch (e) {
    console.warn("[contact] failed to persist lead:", e);
  }

  return NextResponse.json({ ok: true });
}


