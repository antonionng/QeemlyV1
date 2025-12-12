import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const tiers = [
  {
    name: "Early Access",
    price: "Custom",
    description: "Founding teams collaborating on Gulf salary intelligence.",
    bullets: [
      "Unlimited benchmark searches",
      "Expat vs local breakdowns",
      "Confidence indicators",
      "Dashboard seats for 5 users",
    ],
  },
  {
    name: "Team",
    price: "$ / seat",
    description: "For growing teams that want reliable ranges and planning tools.",
    bullets: [
      "Live market updates",
      "Role levels & experience filters",
      "Export to board slides",
      "Priority support",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="space-y-10 py-10">
      <div className="text-center">
        <p className="text-sm font-semibold text-brand-700">Pricing</p>
        <h1 className="mt-2 text-3xl font-semibold text-brand-900">Clear, flexible plans</h1>
        <p className="mt-2 text-base text-brand-800/80">
          Lock pricing during early access, then scale as your team grows.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {tiers.map((tier) => (
          <Card key={tier.name} className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-brand-900">{tier.name}</h2>
                <p className="text-sm text-brand-700/80">{tier.description}</p>
              </div>
              <div className="text-lg font-semibold text-brand-800">{tier.price}</div>
            </div>
            <ul className="space-y-2 text-sm text-brand-800/90">
              {tier.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-600" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <Button className="mt-auto w-full">Talk to us</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

