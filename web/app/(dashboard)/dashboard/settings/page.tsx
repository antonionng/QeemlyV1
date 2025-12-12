import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <Card className="p-6">
      <h1 className="text-xl font-semibold text-brand-900">Settings</h1>
      <p className="mt-2 text-sm text-brand-800/80">
        Manage your organization, seats, and billing in one place. More controls will appear as your workspace grows.
      </p>
    </Card>
  );
}

