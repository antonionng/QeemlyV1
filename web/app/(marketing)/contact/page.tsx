import Link from "next/link";
import { ArrowRight, MessageCircle, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ContactForm } from "@/components/marketing/contact-form";

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-14">
      <section className="rounded-3xl border border-border/70 bg-white px-6 py-12 shadow-sm sm:px-10 lg:px-14">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" className="w-fit gap-2">
                <Zap size={14} />
                Contact
              </Badge>
              <Badge variant="ghost" className="border-border/80 bg-white/70">
                Demo / access
              </Badge>
              <Badge variant="ghost" className="border-border/80 bg-white/70">
                Reply within 24h
              </Badge>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl font-bold leading-tight text-brand-900 sm:text-5xl">Book a demo / request access</h1>
              <p className="text-lg text-brand-700">
                Tell us what you’re hiring for (roles + GCC markets). We’ll show sample outputs and recommend the right plan and
                rollout.
              </p>
            </div>

            <div className="grid gap-4">
              <Card className="p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-brand-900">What happens next</div>
                    <div className="text-sm text-brand-700/90">
                      We’ll reply with a short set of questions, then schedule a quick walkthrough focused on your roles and markets.
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-brand-900">Prefer WhatsApp?</div>
                    <div className="text-sm text-brand-700/90">
                      Mention it in the form—we can follow up there for speed.
                    </div>
                  </div>
                </div>
              </Card>

              <div className="flex flex-wrap items-center gap-3">
                <Link href="/pricing">
                  <Button variant="outline">View pricing</Button>
                </Link>
                <Link href="/search" className="text-sm font-semibold text-brand-700 hover:text-brand-900">
                  Try Benchmark Search →
                </Link>
              </div>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>
    </div>
  );
}





