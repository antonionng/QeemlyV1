"use client";

import { useState } from "react";
import clsx from "clsx";
import { Key, BookOpen, Webhook, Code2, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ApiKeyManager } from "./api-key-manager";
import { EndpointReference } from "./endpoint-reference";
import { WebhookConfig } from "./webhook-config";
import { CodeExamples } from "./code-examples";
import { UsageDashboard } from "./usage-dashboard";

type DevTab = "api_keys" | "reference" | "webhooks" | "examples" | "usage";

const DEV_TABS: { id: DevTab; label: string; icon: typeof Key }[] = [
  { id: "api_keys", label: "API Keys", icon: Key },
  { id: "reference", label: "API Reference", icon: BookOpen },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
  { id: "examples", label: "Code Examples", icon: Code2 },
  { id: "usage", label: "Usage", icon: BarChart3 },
];

export function DeveloperHub() {
  const [activeTab, setActiveTab] = useState<DevTab>("api_keys");

  return (
    <Card className="overflow-hidden">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border px-4 pt-3">
        {DEV_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center gap-1.5 whitespace-nowrap rounded-t-lg px-3 py-2 text-xs font-medium transition-colors",
                activeTab === tab.id
                  ? "border-b-2 border-brand-500 text-brand-900 -mb-px"
                  : "text-brand-500 hover:text-brand-700"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-5 sm:p-6">
        {activeTab === "api_keys" && <ApiKeyManager />}
        {activeTab === "reference" && <EndpointReference />}
        {activeTab === "webhooks" && <WebhookConfig />}
        {activeTab === "examples" && <CodeExamples />}
        {activeTab === "usage" && <UsageDashboard />}
      </div>
    </Card>
  );
}
