import { Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-brand-900">Get in touch</h1>
        <p className="mt-2 text-base text-brand-800/80">
          Tell us what you need and we will follow up with the right benchmarks.
        </p>
      </div>
      <Card className="space-y-5 p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Name" />
          <Input placeholder="Work email" />
          <Input placeholder="Company" />
          <Input placeholder="Role" />
        </div>
        <Input placeholder="What roles or locations are you hiring for?" className="h-14" />
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
        <Button className="w-full">Send</Button>
      </Card>
    </div>
  );
}


