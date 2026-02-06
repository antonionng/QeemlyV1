"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PlayCircle, 
  Download, 
  Users, 
  Calendar, 
  BarChart3,
  Settings,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

interface QuickAction {
  label: string;
  description: string;
  icon: typeof PlayCircle;
  href: string;
  variant: "primary" | "secondary";
}

export function QuickActions() {
  const actions: QuickAction[] = [
    {
      label: "Run Salary Review",
      description: "Start a new compensation review cycle",
      icon: PlayCircle,
      href: "/dashboard/salary-review",
      variant: "primary",
    },
    {
      label: "View Outside Band",
      description: "Employees requiring attention",
      icon: Users,
      href: "/dashboard/salary-review?filter=outside-band",
      variant: "secondary",
    },
    {
      label: "Export Report",
      description: "Download compensation summary",
      icon: Download,
      href: "/dashboard/reports",
      variant: "secondary",
    },
    {
      label: "View Benchmarks",
      description: "Market comparison data",
      icon: BarChart3,
      href: "/dashboard/benchmarks",
      variant: "secondary",
    },
  ];

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-brand-900 mb-4">Quick Actions</h3>
      
      <div className="space-y-2">
        {actions.map((action) => (
          <Link key={action.label} href={action.href}>
            <div className={`
              flex items-center gap-3 p-3 rounded-xl transition-all group cursor-pointer
              ${action.variant === "primary" 
                ? "bg-brand-500 text-white hover:bg-brand-600" 
                : "bg-brand-50 hover:bg-brand-100"
              }
            `}>
              <div className={`
                rounded-lg p-2 flex-shrink-0
                ${action.variant === "primary" 
                  ? "bg-white/20" 
                  : "bg-white"
                }
              `}>
                <action.icon className={`
                  h-4 w-4
                  ${action.variant === "primary" 
                    ? "text-white" 
                    : "text-brand-600"
                  }
                `} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`
                  text-sm font-medium
                  ${action.variant === "primary" 
                    ? "text-white" 
                    : "text-brand-900"
                  }
                `}>
                  {action.label}
                </p>
                <p className={`
                  text-xs
                  ${action.variant === "primary" 
                    ? "text-white/70" 
                    : "text-brand-500"
                  }
                `}>
                  {action.description}
                </p>
              </div>
              <ArrowRight className={`
                h-4 w-4 transition-transform group-hover:translate-x-1
                ${action.variant === "primary" 
                  ? "text-white/70" 
                  : "text-brand-400"
                }
              `} />
            </div>
          </Link>
        ))}
      </div>

      {/* Settings link */}
      <div className="mt-4 pt-4 border-t border-border">
        <Link href="/dashboard/settings">
          <Button variant="ghost" className="w-full justify-start text-brand-600 hover:text-brand-800">
            <Settings className="h-4 w-4 mr-2" />
            Company Settings
          </Button>
        </Link>
      </div>
    </Card>
  );
}
