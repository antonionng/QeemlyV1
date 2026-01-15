"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

type PreferredContact = "email" | "whatsapp";

type ContactFormState = {
  name: string;
  email: string;
  company: string;
  role: string;
  teamSize: string;
  interests: Record<string, boolean>;
  preferredContact: PreferredContact;
  message: string;
};

type Errors = Partial<Record<keyof ContactFormState | "form", string>>;

const interestOptions = [
  { key: "benchmark_search", label: "Benchmark Search" },
  { key: "analytics_dashboard", label: "Analytics Dashboard" },
  { key: "budget_planning", label: "Budget & Planning" },
] as const;

function isEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validate(s: ContactFormState): Errors {
  const errors: Errors = {};
  if (s.name.trim().length < 2) errors.name = "Please enter your name.";
  if (!isEmail(s.email.trim())) errors.email = "Please enter a valid work email.";
  if (s.company.trim().length < 2) errors.company = "Please enter your company name.";
  if (s.role.trim().length < 2) errors.role = "Please enter your role.";
  if (s.message.trim().length < 10) errors.message = "Please add a bit more detail (at least 10 characters).";
  return errors;
}

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<ContactFormState>({
    name: "",
    email: "",
    company: "",
    role: "",
    teamSize: "",
    interests: {
      benchmark_search: true,
      analytics_dashboard: true,
      budget_planning: false,
    },
    preferredContact: "email",
    message: "",
  });

  const selectedInterests = useMemo(() => {
    return Object.entries(state.interests)
      .filter(([, v]) => v)
      .map(([k]) => k);
  }, [state.interests]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");

    const nextErrors = validate(state);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setStatus("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.name,
          email: state.email,
          company: state.company,
          role: state.role,
          teamSize: state.teamSize,
          interests: selectedInterests,
          preferredContact: state.preferredContact,
          message: state.message,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { errors?: Record<string, string> } | null;
        setErrors((prev) => ({ ...prev, ...(data?.errors ?? {}), form: "Something went wrong. Please try again." }));
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrors((prev) => ({ ...prev, form: "Network error. Please try again." }));
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <Card className="p-7 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 ring-1 ring-border">
            <CheckCircle2 className="h-5 w-5 text-brand-700" />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-brand-600">Submitted</div>
            <h2 className="text-2xl font-semibold text-brand-900">Thanks — we’ll reach out shortly</h2>
            <p className="text-sm text-brand-700">
              We’ll review your markets and roles and respond with the right next step (demo, access, or a tailored rollout plan).
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-muted p-4 text-sm text-brand-800/90">
          <div className="font-semibold text-brand-900">What we received</div>
          <div className="mt-1">
            <span className="font-semibold">{state.name}</span> · {state.company} · {state.role}
          </div>
          <div className="mt-1">{state.email}</div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/pricing">
            <Button variant="outline" fullWidth>
              View pricing
            </Button>
          </Link>
          <Link href="/search">
            <Button fullWidth>
              Try Benchmark Search <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-3 text-sm text-brand-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-brand-600" />
            hello@qeemly.com
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-brand-600" />
            WhatsApp preferred for quick follow-ups.
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-7 sm:p-8">
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-brand-900">Request a demo / access</h2>
            <p className="text-sm text-brand-700/90">
              Tell us your roles and GCC markets. We’ll recommend the fastest path to value.
            </p>
          </div>
          <Badge variant="ghost" className="border-border/80 bg-white/70">
            Reply within 24h
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-500">Name</label>
            <Input
              value={state.name}
              onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
              placeholder="Your name"
              fullWidth
              aria-invalid={Boolean(errors.name)}
              className={errors.name ? "border-red-300 focus:border-red-400" : ""}
            />
            {errors.name ? <div className="text-xs text-red-600">{errors.name}</div> : null}
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-500">Work email</label>
            <Input
              value={state.email}
              onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))}
              placeholder="name@company.com"
              inputMode="email"
              fullWidth
              aria-invalid={Boolean(errors.email)}
              className={errors.email ? "border-red-300 focus:border-red-400" : ""}
            />
            {errors.email ? <div className="text-xs text-red-600">{errors.email}</div> : null}
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-500">Company</label>
            <Input
              value={state.company}
              onChange={(e) => setState((s) => ({ ...s, company: e.target.value }))}
              placeholder="Company"
              fullWidth
              aria-invalid={Boolean(errors.company)}
              className={errors.company ? "border-red-300 focus:border-red-400" : ""}
            />
            {errors.company ? <div className="text-xs text-red-600">{errors.company}</div> : null}
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-500">Role</label>
            <Input
              value={state.role}
              onChange={(e) => setState((s) => ({ ...s, role: e.target.value }))}
              placeholder="e.g. Head of People"
              fullWidth
              aria-invalid={Boolean(errors.role)}
              className={errors.role ? "border-red-300 focus:border-red-400" : ""}
            />
            {errors.role ? <div className="text-xs text-red-600">{errors.role}</div> : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-500">Team size</label>
            <select
              value={state.teamSize}
              onChange={(e) => setState((s) => ({ ...s, teamSize: e.target.value }))}
              className="h-12 w-full rounded-full border border-border bg-white px-4 text-sm text-foreground focus:border-brand-300 focus:outline-none"
            >
              <option value="">Select…</option>
              <option value="1-20">1–20</option>
              <option value="21-50">21–50</option>
              <option value="51-200">51–200</option>
              <option value="201-1000">201–1000</option>
              <option value="1000+">1000+</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-500">Preferred contact</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setState((s) => ({ ...s, preferredContact: "email" }))}
                className={[
                  "h-12 rounded-full border px-4 text-sm font-semibold transition-colors",
                  state.preferredContact === "email"
                    ? "border-brand-200 bg-brand-50 text-brand-900"
                    : "border-border bg-white text-brand-700 hover:bg-muted",
                ].join(" ")}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setState((s) => ({ ...s, preferredContact: "whatsapp" }))}
                className={[
                  "h-12 rounded-full border px-4 text-sm font-semibold transition-colors",
                  state.preferredContact === "whatsapp"
                    ? "border-brand-200 bg-brand-50 text-brand-900"
                    : "border-border bg-white text-brand-700 hover:bg-muted",
                ].join(" ")}
              >
                WhatsApp
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Interested in</div>
          <div className="flex flex-wrap gap-2">
            {interestOptions.map((opt) => {
              const active = Boolean(state.interests[opt.key]);
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setState((s) => ({ ...s, interests: { ...s.interests, [opt.key]: !active } }))}
                  className={[
                    "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                    active ? "border-brand-200 bg-brand-50 text-brand-900" : "border-border bg-white text-brand-700 hover:bg-muted",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div className="text-xs text-brand-700/70">You can pick one or multiple.</div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-brand-500">
            What roles / locations are you hiring for?
          </label>
          <Textarea
            value={state.message}
            onChange={(e) => setState((s) => ({ ...s, message: e.target.value }))}
            placeholder="Example: 3 IC3 backend engineers in Dubai, 1 PM in Riyadh; need offer bands and approval-ready exports."
            fullWidth
            aria-invalid={Boolean(errors.message)}
            className={errors.message ? "border-red-300 focus:border-red-400" : ""}
          />
          {errors.message ? <div className="text-xs text-red-600">{errors.message}</div> : null}
        </div>

        {errors.form ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errors.form}</div> : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="submit" fullWidth disabled={status === "submitting"}>
            {status === "submitting" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Sending…
              </>
            ) : (
              <>
                Send request <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
          <Link href="/pricing">
            <Button variant="outline" fullWidth type="button">
              View pricing
            </Button>
          </Link>
        </div>

        <div className="flex flex-col gap-3 text-sm text-brand-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-brand-600" />
            hello@qeemly.com
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-brand-600" />
            WhatsApp preferred for quick follow-ups.
          </div>
        </div>
      </form>
    </Card>
  );
}


